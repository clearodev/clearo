import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dns from 'node:dns/promises';
import { PrivyClient } from '@privy-io/node';
import { getAddress, verifyMessage } from 'viem';

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = resolve(process.cwd(), 'data');
const DB_PATH = resolve(DATA_DIR, 'clearo.sqlite');
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const JSON_BODY_LIMIT_BYTES = Number(process.env.JSON_BODY_LIMIT_BYTES || 32768);
const DNS_RECHECK_INTERVAL_MS = Number(process.env.DNS_RECHECK_INTERVAL_MS || 6 * 60 * 60 * 1000);
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || 'https://clearo.dev').replace(/\/+$/, '');
const rateLimitBuckets = new Map();

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadLocalEnv();

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || '';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || '';
const privy = PRIVY_APP_ID && PRIVY_APP_SECRET
  ? new PrivyClient({ appId: PRIVY_APP_ID, appSecret: PRIVY_APP_SECRET })
  : null;

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runSql(statement, json = false) {
  const args = json ? ['-json', DB_PATH, statement] : [DB_PATH, statement];
  const output = execFileSync('sqlite3', args, { encoding: 'utf8' });
  if (!json) return output;
  return output.trim() ? JSON.parse(output) : [];
}

function addColumnIfMissing(table, column, definition) {
  const existing = runSql(`PRAGMA table_info(${table});`, true);
  if (existing.some((row) => row.name === column)) return;
  runSql(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
}

function expectedDnsRecord(domain, token) {
  return `clearo=v1 chain=base domain=${domain.toLowerCase()} token=${token.toLowerCase()}`;
}

function absoluteUrl(path) {
  return `${PUBLIC_ORIGIN}${path}`;
}

function parseTxtRecord(record) {
  return Object.fromEntries(
    record
      .trim()
      .split(/\s+/)
      .map((part) => {
        const index = part.indexOf('=');
        if (index === -1) return [part.toLowerCase(), ''];
        return [part.slice(0, index).toLowerCase(), part.slice(index + 1)];
      })
  );
}

function findMatchingClearoRecord(records, domain, token) {
  const normalizedDomain = domain.toLowerCase();
  const normalizedToken = token.toLowerCase();
  return records.find((record) => {
    const parsed = parseTxtRecord(record);
    return parsed.clearo === 'v1'
      && parsed.chain?.toLowerCase() === 'base'
      && parsed.domain?.toLowerCase() === normalizedDomain
      && parsed.token?.toLowerCase() === normalizedToken;
  });
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function normalizeDomain(value) {
  const domain = String(value || '').trim().toLowerCase().replace(/\.$/, '');
  if (!domain) throw validationError('domain is required');
  if (domain.length > 253) throw validationError('domain is too long');
  if (domain.includes('://') || domain.includes('/') || domain.includes('@')) {
    throw validationError('domain must be a bare hostname');
  }
  if (domain === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
    throw validationError('domain must be a public hostname');
  }
  const labels = domain.split('.');
  if (labels.length < 2) throw validationError('domain must include a public suffix');
  for (const label of labels) {
    if (!/^[a-z0-9-]{1,63}$/.test(label) || label.startsWith('-') || label.endsWith('-')) {
      throw validationError('domain contains an invalid label');
    }
  }
  return domain;
}

function normalizeTokenAddress(value) {
  try {
    return getAddress(String(value || '').trim()).toLowerCase();
  } catch {
    throw validationError('token_address must be a valid Ethereum address');
  }
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
}

function authError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function requirePrivyUser(req) {
  if (!privy) {
    throw authError(503, 'Privy server credentials are not configured');
  }
  const token = getBearerToken(req);
  if (!token) throw authError(401, 'Privy access token is required');

  let claims;
  try {
    claims = await privy.utils().auth().verifyAuthToken(token);
  } catch {
    throw authError(401, 'Privy access token is invalid');
  }

  const privyDid = claims.user_id || claims.userId || claims.sub;
  if (!privyDid) {
    throw authError(401, 'Privy access token is invalid');
  }
  runSql(`
    INSERT INTO users (privy_did)
    VALUES (${sql(privyDid)})
    ON CONFLICT(privy_did) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP;
  `);
  return runSql(`SELECT * FROM users WHERE privy_did = ${sql(privyDid)} LIMIT 1;`, true)[0];
}

function initDb() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  runSql(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL UNIQUE,
      token_address TEXT NOT NULL,
      chain TEXT NOT NULL DEFAULT 'base',
      name TEXT NOT NULL,
      ticker TEXT NOT NULL,
      dns_status TEXT NOT NULL DEFAULT 'pending',
      wallet_status TEXT NOT NULL DEFAULT 'missing',
      dev_wallet_address TEXT,
      dev_wallet_verified_at TEXT,
      contract_backlink_status TEXT NOT NULL DEFAULT 'missing',
      platform_status TEXT NOT NULL DEFAULT 'missing',
      verification_level TEXT NOT NULL DEFAULT 'Domain Claimed',
      trust_score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unverified',
      details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      privy_did TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS project_owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'owner',
      verified_by TEXT NOT NULL DEFAULT 'dns',
      verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, project_id)
    );
    CREATE TABLE IF NOT EXISTS wallet_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet_address TEXT NOT NULL,
      nonce TEXT NOT NULL UNIQUE,
      message TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  addColumnIfMissing('projects', 'dev_wallet_address', 'TEXT');
  addColumnIfMissing('projects', 'dev_wallet_verified_at', 'TEXT');
  addColumnIfMissing('projects', 'dns_checked_at', 'TEXT');
  addColumnIfMissing('projects', 'dns_verified_at', 'TEXT');
  addColumnIfMissing('projects', 'contract_status', 'TEXT NOT NULL DEFAULT \'missing\'');
  addColumnIfMissing('projects', 'contract_name', 'TEXT');
  addColumnIfMissing('projects', 'contract_symbol', 'TEXT');
  addColumnIfMissing('projects', 'contract_decimals', 'INTEGER');
  addColumnIfMissing('projects', 'contract_checked_at', 'TEXT');

}

function getCanonicalLinks(claims) {
  return claims
    .filter((claim) => /^https?:\/\//i.test(claim.value))
    .map((claim) => ({
      type: claim.type,
      label: claim.label,
      url: claim.value,
      status: claim.status
    }));
}

function buildProofs(project) {
  return [
    {
      type: 'domain',
      label: 'Domain DNS',
      status: project.dns_status,
      checked_at: project.dns_checked_at,
      verified_at: project.dns_verified_at
    },
    {
      type: 'contract',
      label: 'Base contract',
      status: project.contract_status || 'missing',
      checked_at: project.contract_checked_at
    },
    {
      type: 'wallet',
      label: 'Developer wallet',
      status: project.wallet_status,
      verified_at: project.dev_wallet_verified_at
    },
    {
      type: 'contract_backlink',
      label: 'Contract backlink',
      status: project.contract_backlink_status
    },
    {
      type: 'platform',
      label: 'Launch platform metadata',
      status: project.platform_status
    }
  ];
}

function buildAgentProfile(project, claims) {
  return {
    schema: 'clearo.agent_profile.v1',
    id: project.id,
    domain: project.domain,
    chain: project.chain,
    token_address: project.token_address,
    verification_level: project.verification_level,
    trust_score: project.trust_score,
    proofs: buildProofs(project),
    contract: {
      status: project.contract_status || 'missing',
      name: project.contract_name,
      symbol: project.contract_symbol,
      decimals: project.contract_decimals,
      checked_at: project.contract_checked_at
    },
    developer_wallet: {
      status: project.wallet_status,
      address: project.dev_wallet_address,
      verified_at: project.dev_wallet_verified_at
    },
    claims: claims.map((claim) => ({
      type: claim.type,
      label: claim.label,
      value: claim.value,
      status: claim.status,
      details: claim.details,
      created_at: claim.created_at
    })),
    canonical_links: getCanonicalLinks(claims),
    updated_at: project.updated_at
  };
}

function buildAgentActions() {
  return {
    schema: 'clearo.agent_actions.v1',
    chain: {
      id: 8453,
      name: 'Base',
      rpc: BASE_RPC_URL,
      native_currency: 'ETH',
      token_standard: 'ERC-20'
    },
    proof_model: {
      domain_ownership: {
        type: 'dns_txt',
        host: '@',
        format: 'clearo=v1 chain=base domain=<domain> token=<base_token_address>',
        example: expectedDnsRecord('example.com', '0x0000000000000000000000000000000000000000')
      },
      developer_wallet: {
        type: 'eip191_personal_sign',
        challenge_endpoint: '/api/projects/:id/wallet-challenge',
        verify_endpoint: '/api/projects/:id/verify-wallet'
      }
    },
    safe_reads: [
      { method: 'GET', path: '/api/registry/summary', purpose: 'Read registry metrics and recent verified projects.' },
      { method: 'GET', path: '/api/projects/verified', purpose: 'List DNS-verified Base projects.' },
      { method: 'GET', path: '/api/projects?domain=<domain>', purpose: 'Read one project profile by domain.' },
      { method: 'GET', path: '/api/projects?token=<base_token_address>', purpose: 'Read one project profile by Base token contract.' },
      { method: 'GET', path: '/api/projects/:id/agent.json', purpose: 'Read a compact machine profile for one project.' }
    ],
    authenticated_writes: [
      {
        method: 'POST',
        path: '/api/verify/dns',
        auth: 'none',
        purpose: 'Check Base contract metadata and DNS TXT proof before a project claim.',
        body_schema: {
          domain: 'bare public hostname',
          token_address: 'Base ERC-20 contract address'
        }
      },
      {
        method: 'POST',
        path: '/api/auth/claim-project',
        auth: 'Privy bearer token',
        purpose: 'Claim a DNS-verified project for the logged-in owner.',
        body_schema: {
          domain: 'bare public hostname',
          token_address: 'Base ERC-20 contract address',
          name: 'project display name',
          ticker: 'token ticker'
        }
      },
      {
        method: 'POST',
        path: '/api/projects/:id/claims',
        auth: 'Privy bearer token and project owner access',
        purpose: 'Publish owner-managed links and statements for agents and users.',
        body_schema: {
          type: 'github | gitlawb_agent | agent_profile | api_schema | docs | whitepaper | social | wallet | commitment',
          label: 'human-readable claim label',
          value: 'URL, wallet address, or statement',
          details: 'optional explanation'
        }
      }
    ],
    agent_claim_types: [
      { type: 'github', value_format: 'https://github.com/<org>/<repo>', purpose: 'Source repository.' },
      { type: 'gitlawb_agent', value_format: 'https://gitlawb.com/<agent-or-repo>', purpose: 'GitLawb DID profile or signed repository for agents.' },
      { type: 'agent_profile', value_format: 'https://<domain>/agent.json', purpose: 'Project-owned machine-readable agent profile.' },
      { type: 'api_schema', value_format: 'https://<domain>/openapi.json', purpose: 'Project API schema.' },
      { type: 'docs', value_format: 'https://docs.<domain>', purpose: 'Project documentation.' }
    ]
  };
}

function buildAgentManifest() {
  return {
    schema: 'clearo.site_agent_manifest.v1',
    name: 'CLEARO',
    origin: PUBLIC_ORIGIN,
    purpose: 'Public registry for Base token identity, DNS ownership proof, owner claims, and developer wallet verification.',
    default_chain: {
      id: 8453,
      name: 'Base',
      explorer: 'https://basescan.org',
      rpc: BASE_RPC_URL
    },
    discovery: {
      llms_txt: absoluteUrl('/llms.txt'),
      actions: absoluteUrl('/api/agent/actions'),
      registry_summary: absoluteUrl('/api/registry/summary'),
      verified_projects: absoluteUrl('/api/projects/verified')
    },
    project_lookup_templates: {
      by_domain: absoluteUrl('/api/projects?domain={domain}'),
      by_token: absoluteUrl('/api/projects?token={base_token_address}'),
      by_id: absoluteUrl('/api/projects/{id}'),
      agent_profile: absoluteUrl('/api/projects/{id}/agent.json')
    },
    agent_operability: {
      browser_required_for_public_reads: false,
      public_reads_require_auth: false,
      writes_require_human_owner_auth: true,
      write_auth: 'Privy bearer token',
      rate_limited: true
    },
    trust_rules: [
      'Treat DNS TXT verification as proof that the owner controls the project domain for the submitted Base token.',
      'Treat developer wallet verification as proof that the project owner session controlled a wallet able to sign the CLEARO challenge.',
      'Treat owner claims as linked assertions unless their status is dns_verified, wallet_verified, monitored, or another platform-verified status.',
      'Do not treat CLEARO as an endorsement of investment quality, safety, or token value.'
    ]
  };
}

function buildLlmsText() {
  return [
    '# CLEARO',
    '',
    'CLEARO is a public registry for Base token identity. It links a Base ERC-20 token contract to a project domain, DNS TXT proof, owner-published claims, canonical links, and optional developer wallet verification.',
    '',
    'Agents can use CLEARO without running the browser app. Public reads are JSON APIs and do not require authentication.',
    '',
    '## Agent Discovery',
    `- Site manifest: ${absoluteUrl('/.well-known/clearo-agent.json')}`,
    `- Action schema: ${absoluteUrl('/api/agent/actions')}`,
    `- Registry summary: ${absoluteUrl('/api/registry/summary')}`,
    `- Verified projects: ${absoluteUrl('/api/projects/verified')}`,
    '- Project by domain: /api/projects?domain=<domain>',
    '- Project by Base token: /api/projects?token=<base_token_address>',
    '- Project agent profile: /api/projects/:id/agent.json',
    '',
    '## Base Verification',
    '- Chain: Base mainnet, chain ID 8453.',
    '- Token input must be a Base ERC-20 contract address.',
    '- DNS proof format: clearo=v1 chain=base domain=<domain> token=<base_token_address>',
    '- DNS record host: @ on the project domain.',
    '',
    '## Agent-Relevant Claim Types',
    '- github: official source repository.',
    '- gitlawb_agent: GitLawb DID profile or signed repository for agents.',
    '- agent_profile: project-owned machine-readable profile.',
    '- api_schema: project OpenAPI or integration schema.',
    '- docs: project documentation.',
    '',
    '## Trust Rules',
    '- Public project claims are owner assertions unless marked with a stronger verified status.',
    '- DNS proof verifies domain control for a token/domain pair.',
    '- Developer wallet proof verifies a signature challenge from a project owner session.',
    '- CLEARO is not an investment endorsement.'
  ].join('\n');
}

function getProject(filters = {}) {
  const where = filters.token
    ? `LOWER(token_address) = LOWER(${sql(filters.token)})`
    : filters.domain
      ? `LOWER(domain) = LOWER(${sql(filters.domain)})`
      : filters.id
        ? `id = ${Number(filters.id)}`
        : 'id = 1';
  const rows = runSql(`SELECT * FROM projects WHERE ${where} LIMIT 1;`, true);
  if (!rows[0]) return null;
  const project = rows[0];
  const claims = runSql(`SELECT * FROM claims WHERE project_id = ${project.id} ORDER BY id;`, true);
  const events = runSql(`SELECT * FROM events WHERE project_id = ${project.id} ORDER BY id;`, true);
  return {
    ...project,
    claims,
    events,
    proofs: buildProofs(project),
    canonical_links: getCanonicalLinks(claims),
    agent_profile_url: `/api/projects/${project.id}/agent.json`,
    profile_url: `/project/${project.domain}`,
    contract: {
      status: project.contract_status || 'missing',
      name: project.contract_name,
      symbol: project.contract_symbol,
      decimals: project.contract_decimals,
      checked_at: project.contract_checked_at
    },
    agent_profile: buildAgentProfile(project, claims),
    crossChecks: [
      { label: 'DNS claim', status: project.dns_status },
      { label: 'Wallet signature', status: project.wallet_status },
      { label: 'Base contract', status: project.contract_status || 'missing' },
      { label: 'Contract backlink', status: project.contract_backlink_status },
      { label: 'Launch platform metadata', status: project.platform_status }
    ]
  };
}

function getRegistrySummary() {
  const [totals] = runSql(`
    SELECT
      COUNT(*) AS indexed_records,
      SUM(CASE WHEN dns_status = 'verified' THEN 1 ELSE 0 END) AS dns_verified,
      COALESCE((SELECT COUNT(*) FROM claims), 0) AS claims_watched,
      SUM(CASE WHEN trust_score < 40 THEN 1 ELSE 0 END) AS broken_claims
    FROM projects;
  `, true);

  const recentProjects = runSql(`
    SELECT domain, ticker, token_address, trust_score AS score, verification_level AS status, updated_at
    FROM projects
    ORDER BY updated_at DESC, id DESC
    LIMIT 6;
  `, true);

  return {
    metrics: {
      indexed_records: totals.indexed_records || 0,
      dns_verified: totals.dns_verified || 0,
      claims_watched: totals.claims_watched || 0,
      broken_claims: totals.broken_claims || 0
    },
    recent_projects: recentProjects
  };
}

function getVerifiedProjects() {
  return runSql(`
    SELECT
      id,
      domain,
      name,
      ticker,
      token_address,
      chain,
      wallet_status,
      dev_wallet_address,
      contract_status,
      contract_symbol,
      contract_decimals,
      dns_checked_at,
      trust_score AS score,
      verification_level AS status,
      updated_at
    FROM projects
    WHERE dns_status = 'verified'
    ORDER BY updated_at DESC, id DESC;
  `, true);
}

function httpStatus(status) {
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : 500;
}

function errorStatus(status) {
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}

function send(res, status, body) {
  res.writeHead(httpStatus(status), {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization'
  });
  res.end(JSON.stringify(body));
}

function sendText(res, status, body) {
  res.writeHead(httpStatus(status), {
    'content-type': 'text/plain; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization'
  });
  res.end(body);
}

function clientIp(req) {
  return String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim();
}

function rateLimit(req, key, limit, windowMs) {
  const bucketKey = `${key}:${clientIp(req)}`;
  const now = Date.now();
  const bucket = rateLimitBuckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return null;
  }
  bucket.count += 1;
  if (bucket.count <= limit) return null;
  const error = new Error('rate limit exceeded');
  error.status = 429;
  return error;
}

async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > JSON_BODY_LIMIT_BYTES) {
      const error = new Error('request body is too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function recomputeVerification(projectId) {
  const [project] = runSql(`SELECT * FROM projects WHERE id = ${projectId};`, true);
  if (!project) return;

  let level = project.dns_status === 'verified' ? 'Domain Verified' : 'Domain Claimed';
  let score = project.dns_status === 'verified' ? 65 : 15;
  if (project.wallet_status === 'verified') {
    level = 'Domain + Wallet Verified';
    score += 30;
  }
  if (project.contract_status === 'verified') {
    level = project.wallet_status === 'verified' ? 'Domain + Wallet + Contract Verified' : 'Domain + Contract Verified';
    score += 5;
  }
  if (project.contract_backlink_status === 'verified') {
    level = project.wallet_status === 'verified' ? 'Fully Verified' : 'Contract Linked';
    score += 3;
  }
  if (project.platform_status === 'verified') score += 2;
  score = Math.min(score, 100);

  runSql(`
    UPDATE projects
    SET verification_level = ${sql(level)}, trust_score = ${score}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${projectId};
  `);
}

function decodeAbiStringResult(hex) {
  if (!hex || hex === '0x') return '';
  const raw = hex.slice(2);
  if (raw.length === 64) {
    return Buffer.from(raw.replace(/00+$/, ''), 'hex').toString('utf8').trim();
  }
  const offset = Number.parseInt(raw.slice(0, 64), 16) * 2;
  const length = Number.parseInt(raw.slice(offset, offset + 64), 16) * 2;
  if (!Number.isFinite(length) || length <= 0) return '';
  return Buffer.from(raw.slice(offset + 64, offset + 64 + length), 'hex').toString('utf8').trim();
}

async function rpc(method, params) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(BASE_RPC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || 'Base RPC request failed');
    return data.result;
  } finally {
    clearTimeout(timeout);
  }
}

async function readErc20Metadata(tokenAddress) {
  const code = await rpc('eth_getCode', [tokenAddress, 'latest']);
  if (!code || code === '0x') {
    return { status: 'missing', name: null, symbol: null, decimals: null };
  }

  async function call(selector) {
    try {
      return await rpc('eth_call', [{ to: tokenAddress, data: selector }, 'latest']);
    } catch {
      return '';
    }
  }

  const [nameResult, symbolResult, decimalsResult] = await Promise.all([
    call('0x06fdde03'),
    call('0x95d89b41'),
    call('0x313ce567')
  ]);

  const decimals = decimalsResult && decimalsResult !== '0x'
    ? Number.parseInt(decimalsResult, 16)
    : null;

  return {
    status: 'verified',
    name: decodeAbiStringResult(nameResult) || null,
    symbol: decodeAbiStringResult(symbolResult) || null,
    decimals: Number.isFinite(decimals) ? decimals : null
  };
}

function updateContractMetadata(projectId, metadata) {
  runSql(`
    UPDATE projects
    SET contract_status = ${sql(metadata.status)},
        contract_name = ${sql(metadata.name)},
        contract_symbol = ${sql(metadata.symbol)},
        contract_decimals = ${metadata.decimals === null || metadata.decimals === undefined ? 'NULL' : Number(metadata.decimals)},
        contract_checked_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${Number(projectId)};
  `);
  recomputeVerification(projectId);
}

async function checkDnsProof(domain, token) {
  let txtRecords = [];
  try {
    txtRecords = (await dns.resolveTxt(domain)).map((parts) => parts.join(''));
  } catch {
    txtRecords = [];
  }
  return findMatchingClearoRecord(txtRecords, domain, token) || null;
}

async function handleVerifyDns(req, res) {
  const limited = rateLimit(req, 'verify-dns', 20, 60 * 1000);
  if (limited) throw limited;
  const body = await readJson(req);
  const domain = normalizeDomain(body.domain);
  const token = normalizeTokenAddress(body.token_address);

  let contract = null;
  try {
    contract = await readErc20Metadata(token);
  } catch (error) {
    return send(res, 503, { error: 'Base contract check failed', note: error.message });
  }

  const matchedRecord = await checkDnsProof(domain, token);

  const existing = getProject({ domain });
  if (existing && existing.token_address.toLowerCase() === token) {
    runSql(`
      UPDATE projects
      SET dns_status = ${sql(matchedRecord ? 'verified' : 'pending')},
          dns_checked_at = CURRENT_TIMESTAMP,
          dns_verified_at = ${matchedRecord ? 'COALESCE(dns_verified_at, CURRENT_TIMESTAMP)' : 'dns_verified_at'},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${existing.id};
    `);
    updateContractMetadata(existing.id, contract);
    recomputeVerification(existing.id);
  }

  return send(res, 200, {
    matched: Boolean(matchedRecord),
    record: matchedRecord || null,
    expected_record: expectedDnsRecord(domain, token),
    status: matchedRecord ? 'verified' : 'pending',
    contract,
    note: matchedRecord
      ? 'Domain DNS claims this token. Wallet or contract-side checks are still required for ownership-level verification.'
      : 'No matching CLEARO TXT record was found.'
  });
}

async function handleClaimProject(req, res) {
  const limited = rateLimit(req, 'claim-project', 8, 60 * 1000);
  if (limited) throw limited;
  const user = await requirePrivyUser(req);
  const body = await readJson(req);
  const domain = normalizeDomain(body.domain);
  const token = normalizeTokenAddress(body.token_address);
  const name = String(body.name || domain || 'Untitled project').trim();
  const ticker = String(body.ticker || 'TOKEN').trim().toUpperCase();

  let contract;
  try {
    contract = await readErc20Metadata(token);
  } catch (error) {
    return send(res, 503, { error: 'Base contract check failed', note: error.message });
  }
  if (contract.status !== 'verified') {
    return send(res, 422, { error: 'token_address is not a Base contract' });
  }

  const existing = getProject({ domain });
  if (existing && existing.token_address.toLowerCase() !== token) {
    return send(res, 409, {
      error: 'domain already registered to another token',
      note: 'Changing a registered token requires an owner transfer flow.'
    });
  }

  const matchedRecord = await checkDnsProof(domain, token);
  const expectedRecord = expectedDnsRecord(domain, token);
  if (!matchedRecord) {
    if (!existing) {
      runSql(`
        INSERT INTO projects (domain, token_address, chain, name, ticker, dns_status, verification_level, trust_score)
        VALUES (${sql(domain)}, ${sql(token)}, 'base', ${sql(name)}, ${sql(ticker)}, 'pending', 'Domain Claimed', 15)
        ON CONFLICT(domain) DO NOTHING;
      `);
    }
    return send(res, 403, {
      error: 'ownership verification failed',
      expected_record: expectedRecord,
      note: 'Publish this DNS TXT record on the project domain, then try again.'
    });
  }

  runSql(`
    INSERT INTO projects (domain, token_address, chain, name, ticker, dns_status, verification_level, trust_score)
    VALUES (${sql(domain)}, ${sql(token)}, 'base', ${sql(name)}, ${sql(ticker)}, 'verified', 'Domain Claimed', 55)
    ON CONFLICT(domain) DO UPDATE SET
      token_address = excluded.token_address,
      name = excluded.name,
      ticker = excluded.ticker,
      dns_status = 'verified',
      dns_checked_at = CURRENT_TIMESTAMP,
      dns_verified_at = COALESCE(dns_verified_at, CURRENT_TIMESTAMP),
      updated_at = CURRENT_TIMESTAMP;
  `);
  const project = getProject({ domain });
  updateContractMetadata(project.id, contract);
  recomputeVerification(project.id);
  runSql(`
    INSERT INTO project_owners (user_id, project_id, role, verified_by)
    VALUES (${user.id}, ${project.id}, 'owner', 'dns')
    ON CONFLICT(user_id, project_id) DO UPDATE SET verified_at = CURRENT_TIMESTAMP;
    INSERT INTO events (project_id, message)
    VALUES (${project.id}, 'Project ownership linked to login session');
  `);

  return send(res, 200, {
    project: getProject({ domain }),
    record: matchedRecord,
    expected_record: expectedRecord,
    contract
  });
}

async function handleCurrentUser(req, res) {
  const user = await requirePrivyUser(req);
  const projects = runSql(`
    SELECT p.id, p.domain, p.name, p.ticker, po.role, po.verified_by, po.verified_at
    FROM project_owners po
    JOIN projects p ON p.id = po.project_id
    WHERE po.user_id = ${user.id}
    ORDER BY po.verified_at DESC;
  `, true);

  return send(res, 200, {
    user: { id: user.id, privy_did: user.privy_did },
    projects
  });
}

function isProjectOwner(userId, projectId) {
  const rows = runSql(`
    SELECT id FROM project_owners
    WHERE user_id = ${Number(userId)} AND project_id = ${Number(projectId)}
    LIMIT 1;
  `, true);
  return Boolean(rows[0]);
}

function normalizeAddress(value) {
  return String(value || '').trim().toLowerCase();
}

function isEthereumAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || '').trim());
}

function buildWalletChallengeMessage({ project, walletAddress, nonce, expiresAt }) {
  return [
    'CLEARO developer wallet verification',
    '',
    `Domain: ${project.domain}`,
    `Project ID: ${project.id}`,
    `Token: ${project.token_address}`,
    `Chain: ${project.chain}`,
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Expires At: ${expiresAt}`,
    '',
    'Sign this message to prove control of this developer wallet. This does not authorize a transaction.'
  ].join('\n');
}

async function handleCreateWalletChallenge(req, res, projectId) {
  const limited = rateLimit(req, 'wallet-challenge', 10, 60 * 1000);
  if (limited) throw limited;
  const user = await requirePrivyUser(req);
  const project = getProjectById(projectId);
  if (!project) return send(res, 404, { error: 'project not found' });
  if (!isProjectOwner(user.id, projectId)) return send(res, 403, { error: 'project owner access is required' });

  const body = await readJson(req);
  const walletAddress = String(body.wallet_address || '').trim();
  if (!isEthereumAddress(walletAddress)) {
    return send(res, 400, { error: 'A valid Ethereum wallet address is required' });
  }

  const nonce = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const message = buildWalletChallengeMessage({ project, walletAddress, nonce, expiresAt });

  runSql(`
    DELETE FROM wallet_challenges
    WHERE expires_at <= ${sql(new Date().toISOString())} OR consumed_at IS NOT NULL;
    INSERT INTO wallet_challenges (project_id, user_id, wallet_address, nonce, message, expires_at)
    VALUES (${Number(projectId)}, ${Number(user.id)}, ${sql(normalizeAddress(walletAddress))}, ${sql(nonce)}, ${sql(message)}, ${sql(expiresAt)});
  `);

  return send(res, 201, { wallet_address: walletAddress, nonce, message, expires_at: expiresAt });
}

async function handleVerifyDevWallet(req, res, projectId) {
  const limited = rateLimit(req, 'verify-wallet', 10, 60 * 1000);
  if (limited) throw limited;
  const user = await requirePrivyUser(req);
  const project = getProjectById(projectId);
  if (!project) return send(res, 404, { error: 'project not found' });
  if (!isProjectOwner(user.id, projectId)) return send(res, 403, { error: 'project owner access is required' });

  const body = await readJson(req);
  const wallet = String(body.wallet_address || '').trim();
  const requestedWallet = normalizeAddress(wallet);
  const signature = String(body.signature || '').trim();
  const nonce = String(body.nonce || '').trim();
  if (!isEthereumAddress(wallet)) return send(res, 400, { error: 'A valid Ethereum wallet address is required' });
  if (!signature || !nonce) return send(res, 400, { error: 'Wallet signature and challenge nonce are required' });

  const [challenge] = runSql(`
    SELECT * FROM wallet_challenges
    WHERE project_id = ${Number(projectId)}
      AND user_id = ${Number(user.id)}
      AND wallet_address = ${sql(requestedWallet)}
      AND nonce = ${sql(nonce)}
      AND consumed_at IS NULL
      AND expires_at > ${sql(new Date().toISOString())}
    LIMIT 1;
  `, true);
  if (!challenge) return send(res, 400, { error: 'Wallet challenge is missing, expired, or already used' });

  let validSignature = false;
  try {
    validSignature = await verifyMessage({
      address: wallet,
      message: challenge.message,
      signature
    });
  } catch {
    validSignature = false;
  }
  if (!validSignature) {
    return send(res, 403, { error: 'Wallet signature does not match the submitted developer wallet' });
  }

  runSql(`
    UPDATE wallet_challenges
    SET consumed_at = CURRENT_TIMESTAMP
    WHERE id = ${Number(challenge.id)};
    UPDATE projects
    SET wallet_status = 'verified',
        dev_wallet_address = ${sql(wallet)},
        dev_wallet_verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${Number(projectId)};
    DELETE FROM claims
    WHERE project_id = ${Number(projectId)} AND type = 'dev_wallet';
    INSERT INTO claims (project_id, type, label, value, status, details)
    VALUES (${Number(projectId)}, 'dev_wallet', 'Developer wallet', ${sql(wallet)}, 'wallet_verified', 'Wallet signed a CLEARO developer wallet challenge from the project owner session.');
    INSERT INTO events (project_id, message)
    VALUES (${Number(projectId)}, 'Developer wallet signature verified');
  `);
  recomputeVerification(projectId);

  return send(res, 200, { project: getProject({ domain: project.domain }) });
}

async function handleAddClaim(req, res, projectId) {
  const limited = rateLimit(req, 'add-claim', 20, 60 * 1000);
  if (limited) throw limited;
  const user = await requirePrivyUser(req);
  const project = getProjectById(projectId);
  if (!project) return send(res, 404, { error: 'project not found' });
  if (!isProjectOwner(user.id, projectId)) return send(res, 403, { error: 'project owner access is required' });

  const body = await readJson(req);
  const type = String(body.type || '').trim();
  const label = String(body.label || '').trim();
  const value = String(body.value || '').trim();
  const details = String(body.details || '').trim();
  if (!type || !label || !value) return send(res, 400, { error: 'type, label, and value are required' });

  runSql(`
    INSERT INTO claims (project_id, type, label, value, status, details)
    VALUES (${Number(projectId)}, ${sql(type)}, ${sql(label)}, ${sql(value)}, 'linked', ${sql(details)});
    INSERT INTO events (project_id, message)
    VALUES (${Number(projectId)}, ${sql(`${label} claim added`)});
  `);
  return send(res, 201, getProject({ domain: project.domain }));
}

function getProjectById(id) {
  return runSql(`SELECT * FROM projects WHERE id = ${Number(id)} LIMIT 1;`, true)[0] || null;
}

async function recheckProjectProofs() {
  const projects = runSql('SELECT id, domain, token_address, dns_status FROM projects ORDER BY id;', true);
  for (const project of projects) {
    try {
      const matchedRecord = await checkDnsProof(project.domain, project.token_address);
      const nextStatus = matchedRecord ? 'verified' : 'pending';
      if (nextStatus !== project.dns_status) {
        runSql(`
          INSERT INTO events (project_id, message)
          VALUES (${Number(project.id)}, ${sql(nextStatus === 'verified' ? 'DNS record observed again' : 'DNS record no longer resolves')});
        `);
      }
      runSql(`
        UPDATE projects
        SET dns_status = ${sql(nextStatus)},
            dns_checked_at = CURRENT_TIMESTAMP,
            dns_verified_at = ${matchedRecord ? 'COALESCE(dns_verified_at, CURRENT_TIMESTAMP)' : 'dns_verified_at'},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${Number(project.id)};
      `);
      const contract = await readErc20Metadata(project.token_address);
      updateContractMetadata(project.id, contract);
      recomputeVerification(project.id);
    } catch (error) {
      console.error(`Proof recheck failed for project ${project.id}:`, error.message);
    }
  }
}

initDb();
setInterval(recheckProjectProofs, DNS_RECHECK_INTERVAL_MS).unref();

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && (url.pathname === '/.well-known/clearo-agent.json' || url.pathname === '/agent.json')) {
      return send(res, 200, buildAgentManifest());
    }

    if (req.method === 'GET' && url.pathname === '/llms.txt') {
      return sendText(res, 200, buildLlmsText());
    }

    if (req.method === 'GET' && url.pathname === '/api/agent/actions') {
      return send(res, 200, buildAgentActions());
    }

    if (req.method === 'GET' && url.pathname === '/api/projects') {
      const project = getProject({
        token: url.searchParams.get('token'),
        domain: url.searchParams.get('domain')
      });
      return project ? send(res, 200, project) : send(res, 404, { error: 'project not found' });
    }

    const projectByIdMatch = url.pathname.match(/^\/api\/projects\/(\d+)$/);
    if (req.method === 'GET' && projectByIdMatch) {
      const project = getProject({ id: projectByIdMatch[1] });
      return project ? send(res, 200, project) : send(res, 404, { error: 'project not found' });
    }

    const agentProfileMatch = url.pathname.match(/^\/api\/projects\/(\d+)\/agent\.json$/);
    if (req.method === 'GET' && agentProfileMatch) {
      const project = getProject({ id: agentProfileMatch[1] });
      return project ? send(res, 200, project.agent_profile) : send(res, 404, { error: 'project not found' });
    }

    if (req.method === 'GET' && url.pathname === '/api/registry/summary') {
      return send(res, 200, getRegistrySummary());
    }

    if (req.method === 'GET' && url.pathname === '/api/projects/verified') {
      return send(res, 200, { projects: getVerifiedProjects() });
    }

    if (req.method === 'POST' && url.pathname === '/api/verify/dns') {
      return await handleVerifyDns(req, res);
    }

    if (req.method === 'GET' && url.pathname === '/api/auth/me') {
      return await handleCurrentUser(req, res);
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/claim-project') {
      return await handleClaimProject(req, res);
    }

    const walletChallengeMatch = url.pathname.match(/^\/api\/projects\/(\d+)\/wallet-challenge$/);
    if (req.method === 'POST' && walletChallengeMatch) {
      return await handleCreateWalletChallenge(req, res, walletChallengeMatch[1]);
    }

    const walletVerifyMatch = url.pathname.match(/^\/api\/projects\/(\d+)\/verify-wallet$/);
    if (req.method === 'POST' && walletVerifyMatch) {
      return await handleVerifyDevWallet(req, res, walletVerifyMatch[1]);
    }

    const claimMatch = url.pathname.match(/^\/api\/projects\/(\d+)\/claims$/);
    if (req.method === 'POST' && claimMatch) {
      return await handleAddClaim(req, res, claimMatch[1]);
    }

    return send(res, 404, { error: 'not found' });
  } catch (error) {
    const status = errorStatus(error.status);
    if (status >= 500) console.error(error);
    return send(res, status, { error: error.message || 'server error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`CLEARO API listening on ${HOST}:${PORT}`);
});
