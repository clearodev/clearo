import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dns from 'node:dns/promises';
import { PrivyClient } from '@privy-io/node';

const PORT = Number(process.env.PORT || 3001);
const DATA_DIR = resolve(process.cwd(), 'data');
const DB_PATH = resolve(DATA_DIR, 'clearo.sqlite');

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

function tryRunSql(statement) {
  try {
    runSql(statement);
  } catch {
    // Schema migrations are idempotent; duplicate-column errors can be ignored.
  }
}

function expectedDnsRecord(domain, token) {
  return `clearo=v1 chain=base domain=${domain.toLowerCase()} token=${token.toLowerCase()}`;
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
  `);

  tryRunSql('ALTER TABLE projects ADD COLUMN dev_wallet_address TEXT;');
  tryRunSql('ALTER TABLE projects ADD COLUMN dev_wallet_verified_at TEXT;');

  const [{ count }] = runSql('SELECT COUNT(*) AS count FROM projects;', true);
  if (count > 0) return;

  runSql(`
    INSERT INTO projects (
      domain, token_address, chain, name, ticker, dns_status, wallet_status,
      dev_wallet_address, dev_wallet_verified_at, contract_backlink_status,
      platform_status, verification_level, trust_score
    ) VALUES (
      'test.com',
      '0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811',
      'base',
      'Test Project',
      'TEST',
      'verified',
      'verified',
      '0x742d35cc6634c0532925a3b844bc454e4438f44e',
      CURRENT_TIMESTAMP,
      'missing',
      'missing',
      'Domain + Wallet Verified',
      95
    );
    INSERT INTO claims (project_id, type, label, value, status, details) VALUES
      (1, 'official_token', 'Official token', '0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811', 'dns_verified', 'DNS TXT record resolves to this Base token contract.'),
      (1, 'dev_wallet', 'Developer wallet', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'wallet_verified', 'Developer wallet connected through the project owner login session.'),
      (1, 'commitment', 'Team sale lock', 'No team wallet sales before Aug 1, 2026', 'monitored', 'CLEARO monitors disclosed team wallets for early sales.'),
      (1, 'fee_usage', 'Fee usage', 'Creator fees fund agent compute and indexer costs.', 'monitored', 'Public operating claim, monitored through disclosed fee wallet.'),
      (1, 'whitepaper', 'Whitepaper', 'https://test.com/whitepaper.pdf', 'linked', 'Linked from the verified domain.');
    INSERT INTO events (project_id, message) VALUES
      (1, 'DNS record first observed'),
      (1, 'Developer wallet verified'),
      (1, 'Fee wallet monitoring enabled'),
      (1, 'Whitepaper link added');
  `);
}

function getProject(filters = {}) {
  const where = filters.token
    ? `LOWER(token_address) = LOWER(${sql(filters.token)})`
    : filters.domain
      ? `LOWER(domain) = LOWER(${sql(filters.domain)})`
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
    crossChecks: [
      { label: 'DNS claim', status: project.dns_status },
      { label: 'Wallet signature', status: project.wallet_status },
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
    SELECT domain, ticker, trust_score AS score, verification_level AS status
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

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
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

async function handleVerifyDns(req, res) {
  const body = await readJson(req);
  const domain = String(body.domain || '').trim().toLowerCase();
  const token = String(body.token_address || '').trim().toLowerCase();
  if (!domain || !token) return send(res, 400, { error: 'domain and token_address are required' });

  let txtRecords = [];
  try {
    txtRecords = (await dns.resolveTxt(domain)).map((parts) => parts.join(''));
  } catch {
    txtRecords = [];
  }

  const matchedRecord = findMatchingClearoRecord(txtRecords, domain, token);

  const existing = getProject({ domain });
  if (existing && existing.token_address.toLowerCase() === token) {
    runSql(`
      UPDATE projects
      SET dns_status = ${sql(matchedRecord ? 'verified' : 'pending')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${existing.id};
    `);
    recomputeVerification(existing.id);
  }

  return send(res, 200, {
    matched: Boolean(matchedRecord),
    record: matchedRecord || null,
    expected_record: expectedDnsRecord(domain, token),
    status: matchedRecord ? 'verified' : 'pending',
    note: matchedRecord
      ? 'Domain DNS claims this token. Wallet or contract-side checks are still required for ownership-level verification.'
      : 'No matching CLEARO TXT record was found.'
  });
}

async function handleCreateProject(req, res) {
  const body = await readJson(req);
  const domain = String(body.domain || '').trim().toLowerCase();
  const token = String(body.token_address || '').trim();
  const name = String(body.name || domain || 'Untitled project').trim();
  const ticker = String(body.ticker || 'TOKEN').trim().toUpperCase();
  if (!domain || !token) return send(res, 400, { error: 'domain and token_address are required' });

  runSql(`
    INSERT INTO projects (domain, token_address, chain, name, ticker, dns_status, verification_level, trust_score)
    VALUES (${sql(domain)}, ${sql(token)}, 'base', ${sql(name)}, ${sql(ticker)}, 'pending', 'Domain Claimed', 15)
    ON CONFLICT(domain) DO UPDATE SET
      token_address = excluded.token_address,
      name = excluded.name,
      ticker = excluded.ticker,
      updated_at = CURRENT_TIMESTAMP;
  `);
  const saved = getProject({ domain });
  return send(res, 200, saved);
}

async function handleClaimProject(req, res) {
  const user = await requirePrivyUser(req);
  const body = await readJson(req);
  const domain = String(body.domain || '').trim().toLowerCase();
  const token = String(body.token_address || '').trim().toLowerCase();
  const name = String(body.name || domain || 'Untitled project').trim();
  const ticker = String(body.ticker || 'TOKEN').trim().toUpperCase();
  if (!domain || !token) return send(res, 400, { error: 'domain and token_address are required' });

  const existing = getProject({ domain });
  if (existing && existing.token_address.toLowerCase() !== token) {
    return send(res, 409, {
      error: 'domain already registered to another token',
      note: 'Changing a registered token requires an owner transfer flow.'
    });
  }

  let txtRecords = [];
  try {
    txtRecords = (await dns.resolveTxt(domain)).map((parts) => parts.join(''));
  } catch {
    txtRecords = [];
  }

  const matchedRecord = findMatchingClearoRecord(txtRecords, domain, token);
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
      updated_at = CURRENT_TIMESTAMP;
  `);
  const project = getProject({ domain });
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
    expected_record: expectedRecord
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

function extractWalletAddresses(privyUser) {
  const accounts = privyUser?.linked_accounts || privyUser?.linkedAccounts || [];
  return accounts
    .filter((account) => account?.type === 'wallet' || account?.type === 'smart_wallet')
    .map((account) => account.address || account.wallet_address)
    .filter(Boolean);
}

async function getLinkedWalletAddresses(privyDid) {
  const privyUser = await privy.users()._get(privyDid);
  return extractWalletAddresses(privyUser);
}

async function handleVerifyDevWallet(req, res, projectId) {
  const user = await requirePrivyUser(req);
  const project = getProjectById(projectId);
  if (!project) return send(res, 404, { error: 'project not found' });
  if (!isProjectOwner(user.id, projectId)) return send(res, 403, { error: 'project owner access is required' });

  const body = await readJson(req);
  const requestedWallet = normalizeAddress(body.wallet_address);
  const wallets = await getLinkedWalletAddresses(user.privy_did);
  const wallet = wallets.find((address) => normalizeAddress(address) === requestedWallet) || wallets[0];

  if (!wallet) {
    return send(res, 400, { error: 'No developer wallet is connected through this login session' });
  }
  if (requestedWallet && normalizeAddress(wallet) !== requestedWallet) {
    return send(res, 403, { error: 'Submitted wallet is not connected through this login session' });
  }

  runSql(`
    UPDATE projects
    SET wallet_status = 'verified',
        dev_wallet_address = ${sql(wallet)},
        dev_wallet_verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${Number(projectId)};
    DELETE FROM claims
    WHERE project_id = ${Number(projectId)} AND type = 'dev_wallet';
    INSERT INTO claims (project_id, type, label, value, status, details)
    VALUES (${Number(projectId)}, 'dev_wallet', 'Developer wallet', ${sql(wallet)}, 'wallet_verified', 'Wallet is connected through the project owner login session.');
    INSERT INTO events (project_id, message)
    VALUES (${Number(projectId)}, 'Developer wallet verified');
  `);
  recomputeVerification(projectId);

  return send(res, 200, { project: getProject({ domain: project.domain }) });
}

async function handleAddClaim(req, res, projectId) {
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

initDb();

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && url.pathname === '/api/projects') {
      const project = getProject({
        token: url.searchParams.get('token'),
        domain: url.searchParams.get('domain')
      });
      return project ? send(res, 200, project) : send(res, 404, { error: 'project not found' });
    }

    if (req.method === 'GET' && url.pathname === '/api/registry/summary') {
      return send(res, 200, getRegistrySummary());
    }

    if (req.method === 'GET' && url.pathname === '/api/projects/verified') {
      return send(res, 200, { projects: getVerifiedProjects() });
    }

    if (req.method === 'POST' && url.pathname === '/api/projects') {
      return await handleCreateProject(req, res);
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
}).listen(PORT, () => {
  console.log(`CLEARO API listening on ${PORT}`);
});
