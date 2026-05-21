import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider, getAccessToken, usePrivy } from '@privy-io/react-auth';
import {
  Check,
  Clock3,
  Globe2,
  Search,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  WalletCards,
  ClipboardCopy
} from 'lucide-react';
import './styles.css';

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function mapApiProject(data) {
  return {
    id: data.id,
    name: data.name,
    token: data.ticker,
    domain: data.domain,
    chain: data.chain,
    verifiedAt: data.updated_at ? new Date(data.updated_at.replace(' ', 'T')).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) : 'May 20, 2026',
    score: data.trust_score,
    status: data.verification_level,
    tokenAddress: data.token_address,
    walletStatus: data.wallet_status,
    devWalletAddress: data.dev_wallet_address,
    devWalletVerifiedAt: data.dev_wallet_verified_at,
    summary: data.summary || `${data.domain} claims ${data.ticker} on ${data.chain}.`,
    claims: data.claims || [],
    events: (data.events || []).map((event) => event.message || event),
    crossChecks: data.crossChecks || []
  };
}

function shortAddress(value) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : '0x...';
}

function getUserWalletAddress(user) {
  const linkedWallet = (user?.linkedAccounts || user?.linked_accounts || [])
    .find((account) => account?.type === 'wallet' || account?.type === 'smart_wallet');
  return user?.wallet?.address || linkedWallet?.address || linkedWallet?.wallet_address || '';
}

function App() {
  if (!privyAppId) return <PrivySetupMissing />;
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['wallet', 'email', 'twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#00cc88',
          showWalletLoginFirst: true
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'off'
          }
        }
      }}
    >
      <AppShell />
    </PrivyProvider>
  );
}

function AppShell() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [path, setPath] = useState(window.location.pathname);
  const [account, setAccount] = useState({ user: null, projects: [] });
  const [accountLoading, setAccountLoading] = useState(true);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
    window.scrollTo(0, 0);
  };

  const refreshAccount = async () => {
    if (!ready || !authenticated) {
      setAccount({ user: null, projects: [] });
      setAccountLoading(false);
      return;
    }
    setAccountLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setAccount({ user: null, projects: [] });
        return;
      }
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        setAccount({ user: null, projects: [] });
        return;
      }
      setAccount(await response.json());
    } finally {
      setAccountLoading(false);
    }
  };

  useEffect(() => {
    refreshAccount();
  }, [ready, authenticated, user?.id]);

  const auth = { ready, authenticated, user, login, logout, account, accountLoading, refreshAccount };

  // Simple routing
  if (path === '/docs') return <DocsPage navigate={navigate} auth={auth} />;
  if (path === '/profile') return <AccountPage navigate={navigate} auth={auth} />;
  if (path === '/claim') return <ClaimPage navigate={navigate} auth={auth} />;
  if (path === '/browse') return <BrowsePage navigate={navigate} auth={auth} />;
  
  const projectMatch = path.match(/^\/project\/(.+)$/);
  if (projectMatch) {
    return <ProfilePage domain={projectMatch[1]} navigate={navigate} auth={auth} />;
  }

  return <HomePage navigate={navigate} auth={auth} />;
}

function Header({ navigate, auth }) {
  const primaryProject = auth.account.projects[0];
  const userLabel = primaryProject?.domain || auth.user?.email?.address || auth.user?.wallet?.address || 'Logged-in account';
  return (
    <header className="topbar">
      <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>CLEARO</a>
      <nav className="nav-links">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Registry</a>
        <a href="/browse" onClick={(e) => { e.preventDefault(); navigate('/browse'); }}>Browse</a>
        <a href="/claim" onClick={(e) => { e.preventDefault(); navigate('/claim'); }}>Claim</a>
        <a href="/docs" onClick={(e) => { e.preventDefault(); navigate('/docs'); }}>Docs</a>
        {auth.authenticated ? (
          <div className="user-session">
            <button className="profile-link" onClick={() => navigate('/profile')}>{userLabel}</button>
            <button onClick={auth.logout} className="logout-btn">Logout</button>
          </div>
        ) : (
          <button className="login-link" onClick={auth.login} disabled={!auth.ready}>Log in</button>
        )}
      </nav>
    </header>
  );
}

function HomePage({ navigate, auth }) {
  const [search, setSearch] = useState('');
  const [registrySummary, setRegistrySummary] = useState({
    metrics: {
      indexed_records: 0,
      dns_verified: 0,
      claims_watched: 0,
      broken_claims: 0
    },
    recent_projects: []
  });

  useEffect(() => {
    async function loadRegistrySummary() {
      try {
        const response = await fetch('/api/registry/summary');
        if (!response.ok) throw new Error('Registry summary unavailable');
        setRegistrySummary(await response.json());
      } catch {
        setRegistrySummary((current) => current);
      }
    }
    loadRegistrySummary();
  }, []);

  useDecryptOnView();

  return (
    <main className="page">
      <Header navigate={navigate} auth={auth} />
      
      <section className="hero">
        <div className="folio">CLR</div>
        <div className="hero-main">
          <p className="section-label">Decentralized Token Identity</p>
          <h1 className="decrypt-text" data-text="Verified by domain, proven by chain.">
            Verified by domain, proven by chain.
          </h1>
          <p className="lede">
            The source of truth for Base projects. Search the registry or claim your identity via DNS.
          </p>
          
          <div className="search-box-large">
            <Search size={20} />
            <input 
              placeholder="Search by domain or contract..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/project/${search}`)}
            />
            <button onClick={() => navigate(`/project/${search}`)}>Search</button>
          </div>
        </div>
      </section>

      <section className="metrics">
        <Metric number={formatNumber(registrySummary.metrics.indexed_records)} label="Indexed records" />
        <Metric number={formatNumber(registrySummary.metrics.dns_verified)} label="DNS verified" />
        <Metric number={formatNumber(registrySummary.metrics.claims_watched)} label="Claims watched" />
        <Metric number={formatNumber(registrySummary.metrics.broken_claims)} label="Broken claims" />
      </section>

      <section className="examples-section">
        <div className="section-title">
          <p className="section-label">Live Records</p>
          <h2 className="decrypt-text" data-text="Recent project verifications.">Recent project verifications.</h2>
          <div className="section-actions">
            <button className="button secondary" onClick={() => navigate('/browse')}>
              Browse Verified <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="examples-grid">
          {registrySummary.recent_projects.map(ex => (
            <div key={ex.domain} className="example-card" onClick={() => navigate(`/project/${ex.domain}`)}>
              <div className="ex-header">
                <strong>{ex.domain}</strong>
                <span>{ex.ticker}</span>
              </div>
              <div className="ex-body">
                <div className="ex-stat">
                  <span>Score</span>
                  <strong>{ex.score ?? 0}</strong>
                </div>
                <div className="ex-stat">
                  <span>Status</span>
                  <strong className="signal-text">{ex.status}</strong>
                </div>
              </div>
              <ArrowRight size={16} className="ex-arrow" />
            </div>
          ))}
          {registrySummary.recent_projects.length === 0 ? (
            <div className="empty-state">
              <strong>No records indexed</strong>
              <p>Verified project records will appear here after the database is populated.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="login-section" id="login">
        <div className="section-title">
          <p className="section-label">Project Management</p>
          <h2 className="decrypt-text" data-text="Register a project with DNS proof.">Register a project with DNS proof.</h2>
        </div>
        <div className="claim-cta">
          <UserCheck size={26} />
          <div>
            <h3>Claim flow is separate from search.</h3>
            <p>Log in with Privy, enter the project domain and Base token contract, then publish the TXT record shown on the claim page. CLEARO links the project to your account only after DNS resolves.</p>
            <button className="button primary" onClick={() => navigate('/claim')}>
              Start Claim <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function AccountPage({ navigate, auth }) {
  const projects = auth.account.projects || [];

  if (auth.accountLoading) {
    return (
      <main className="page">
        <Header navigate={navigate} auth={auth} />
        <div className="page-loading">SYNCING PROFILE...</div>
      </main>
    );
  }

  if (!auth.authenticated) {
    return (
      <main className="page">
        <Header navigate={navigate} auth={auth} />
        <div className="error-hero">
          <h1>PROFILE</h1>
          <p>Log in to view your linked projects or claim a new one.</p>
          <button className="button secondary" onClick={auth.login}>Log in with Privy</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <Header navigate={navigate} auth={auth} />
      <section className="hero">
        <div className="folio">ACC</div>
        <div className="hero-main">
          <p className="section-label">Account Profile</p>
          <h1 className="decrypt-text" data-text={projects.length > 0 ? 'Your claimed projects.' : 'No claimed projects yet.'}>
            {projects.length > 0 ? 'Your claimed projects.' : 'No claimed projects yet.'}
          </h1>
          <p className="lede">
            This is your authenticated CLEARO session. It shows projects linked to your login after domain ownership is verified with DNS.
          </p>
          <div className="actions">
            <button className="button primary" onClick={() => navigate('/claim')}>
              Claim Project <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="hero-record">
          <div className="record-score">
            <span>Linked Projects</span>
            <strong>{projects.length}</strong>
          </div>
          <div className="record-row">
            <span>Session</span>
            <strong>Privy</strong>
          </div>
          <div className="record-row">
            <span>Access</span>
            <strong>{projects.length > 0 ? 'Owner' : 'Unassigned'}</strong>
          </div>
        </div>
      </section>

      {projects.length > 0 ? (
        <section className="claims">
          <div className="section-title">
            <p className="section-label">Claimed Project</p>
            <h2>Your linked project{projects.length > 1 ? 's' : ''}.</h2>
          </div>
          <div className="claims-grid">
            <div className="project-summary">
              <div className="token-mark">{projects[0].ticker.slice(0, 3)}</div>
              <p className="section-label">Primary Project</p>
              <h3>{projects[0].name}</h3>
              <p>{projects[0].domain}</p>
              <button className="button primary" onClick={() => navigate(`/project/${projects[0].domain}`)}>
                Open Project
              </button>
            </div>
            <div className="claim-list">
              {projects.map((project) => (
                <div key={project.id} className="claim-card">
                  <span><Check size={18} /></span>
                  <div>
                    <strong>{project.domain}</strong>
                    <p>{project.name} · {project.role || 'owner'}</p>
                    <button className="text-link" onClick={() => navigate(`/project/${project.domain}`)}>
                      View profile <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <aside className="events">
              <p className="section-label">Account Details</p>
              <div className="event">
                <span>1</span>
                <p>Privy DID: {auth.account.user?.privy_did || auth.user?.id || 'unknown'}</p>
              </div>
              <div className="event">
                <span>2</span>
                <p>Owner links are read from the database and control claim writes for the listed projects.</p>
              </div>
            </aside>
          </div>
        </section>
      ) : (
        <section className="login-section" id="claim">
          <div className="section-title">
            <p className="section-label">Project Management</p>
            <h2>Claim a project from a dedicated page.</h2>
          </div>
          <div className="claim-cta">
            <UserCheck size={26} />
            <div>
              <h3>DNS proof is required.</h3>
              <p>Use the claim page to generate the exact TXT record for your domain and token. After DNS resolves, CLEARO links the project to this profile.</p>
              <button className="button primary" onClick={() => navigate('/claim')}>
                Open Claim Page <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function BrowsePage({ navigate, auth }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVerifiedProjects() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/projects/verified');
        if (!response.ok) throw new Error('Verified projects unavailable');
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadVerifiedProjects();
  }, []);

  return (
    <main className="page">
      <Header navigate={navigate} auth={auth} />
      <section className="hero browse-hero">
        <div className="folio">IDX</div>
        <div className="hero-main">
          <p className="section-label">Verified Projects</p>
          <h1 className="decrypt-text" data-text="Browse domain-verified records.">
            Browse domain-verified records.
          </h1>
          <p className="lede">
            Public project profiles that have passed CLEARO DNS verification. Each record links a domain to a Base token contract.
          </p>
        </div>
        <div className="hero-record">
          <div className="record-score">
            <span>Verified</span>
            <strong>{loading ? '...' : projects.length}</strong>
          </div>
          <div className="record-row">
            <span>Source</span>
            <strong>Database</strong>
          </div>
          <div className="record-row">
            <span>Filter</span>
            <strong>DNS verified</strong>
          </div>
        </div>
      </section>

      <section className="browse-section">
        <div className="section-title">
          <p className="section-label">Registry Index</p>
          <h2>Verified project list.</h2>
        </div>
        <div className="browse-grid">
          {loading ? <div className="empty-state"><strong>Loading verified projects</strong><p>Reading the public registry endpoint.</p></div> : null}
          {error ? <div className="empty-state"><strong>Unable to load</strong><p>{error}</p></div> : null}
          {!loading && !error && projects.length === 0 ? (
            <div className="empty-state">
              <strong>No verified projects</strong>
              <p>Projects appear here after their DNS TXT record verifies successfully.</p>
              <button className="button primary" onClick={() => navigate('/claim')}>Claim Project</button>
            </div>
          ) : null}
          {projects.map((project) => (
            <button key={project.id} className="browse-card" onClick={() => navigate(`/project/${project.domain}`)}>
              <div className="browse-card-head">
                <strong>{project.domain}</strong>
                <span>{project.ticker}</span>
              </div>
              <h3>{project.name}</h3>
              <p>{shortAddress(project.token_address)} on {project.chain}</p>
              <div className="browse-card-meta">
                <span>Score {project.score ?? 0}</span>
                <span>{project.status}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function ClaimPage({ navigate, auth }) {
  return (
    <main className="page">
      <Header navigate={navigate} auth={auth} />
      <section className="hero claim-hero">
        <div className="folio">DNS</div>
        <div className="hero-main">
          <p className="section-label">Register Project</p>
          <h1 className="decrypt-text" data-text="Claim access with a DNS TXT record.">
            Claim access with a DNS TXT record.
          </h1>
          <p className="lede">
            Privy identifies your account. DNS proves the account controls the project domain for the submitted Base token contract.
          </p>
        </div>
        <div className="hero-record">
          <div className="record-score">
            <span>Check</span>
            <strong>TXT</strong>
          </div>
          <div className="record-row">
            <span>Login</span>
            <strong>Privy session</strong>
          </div>
          <div className="record-row">
            <span>Proof</span>
            <strong>DNS record</strong>
          </div>
          <div className="record-row">
            <span>Result</span>
            <strong>Owner access</strong>
          </div>
        </div>
      </section>

      <section className="claim-flow">
        <div className="section-title">
          <p className="section-label">Claim Steps</p>
          <h2>Generate, publish, verify.</h2>
        </div>
        <div className="claim-flow-grid">
          <div className="claim-steps">
            <div className="claim-step">
              <span>1</span>
              <div>
                <strong>Log in</strong>
                <p>Use Privy so the verified project can be attached to your account.</p>
              </div>
            </div>
            <div className="claim-step">
              <span>2</span>
              <div>
                <strong>Add DNS TXT</strong>
                <p>Publish the exact record generated by the form at the root of your project domain.</p>
              </div>
            </div>
            <div className="claim-step">
              <span>3</span>
              <div>
                <strong>Verify and claim</strong>
                <p>Run the DNS check first. A passing check unlocks the final project claim button.</p>
              </div>
            </div>
          </div>
          <ClaimProjectForm
            auth={auth}
            navigate={navigate}
            onSuccess={(data) => navigate(`/project/${data.project.domain}`)}
          />
        </div>
      </section>
    </main>
  );
}

function ClaimProjectForm({ auth, navigate, onSuccess }) {
  const [claimDomain, setClaimDomain] = useState('');
  const [claimToken, setClaimToken] = useState('');
  const [claimName, setClaimName] = useState('');
  const [claimTicker, setClaimTicker] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [dnsVerifying, setDnsVerifying] = useState(false);
  const [dnsVerified, setDnsVerified] = useState(false);
  const [dnsMessage, setDnsMessage] = useState('');
  const [recordCopied, setRecordCopied] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimResult, setClaimResult] = useState(null);
  const normalizedDomain = claimDomain.trim().toLowerCase();
  const normalizedToken = claimToken.trim().toLowerCase();
  const expectedRecord = normalizedDomain && normalizedToken
    ? `clearo=v1 chain=base domain=${normalizedDomain} token=${normalizedToken}`
    : '';

  const copyExpectedRecord = async () => {
    if (!expectedRecord) return;
    await navigator.clipboard.writeText(expectedRecord);
    setRecordCopied(true);
  };

  const resetDnsCheck = () => {
    setDnsVerified(false);
    setDnsMessage('');
    setClaimError('');
    setClaimResult(null);
    setRecordCopied(false);
  };

  const verifyDnsRecord = async () => {
    if (!expectedRecord) return;
    setDnsVerifying(true);
    setDnsMessage('');
    setClaimError('');
    setClaimResult(null);
    try {
      const response = await fetch('/api/verify/dns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          domain: claimDomain,
          token_address: claimToken
        })
      });
      const data = await response.json();
      setClaimResult(data);
      setDnsVerified(Boolean(data.matched));
      setDnsMessage(data.matched
        ? 'DNS TXT record verified. You can claim this project now.'
        : data.note || 'No matching DNS TXT record was found yet.');
    } catch (err) {
      setDnsVerified(false);
      setDnsMessage(err.message || 'DNS verification failed');
    } finally {
      setDnsVerifying(false);
    }
  };

  const submitClaim = async (e) => {
    e.preventDefault();
    if (!auth.authenticated) {
      auth.login();
      return;
    }
    if (!dnsVerified) {
      setClaimError('Verify the DNS TXT record before claiming this project.');
      return;
    }
    setVerifying(true);
    setClaimError('');
    setClaimResult(null);
    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/auth/claim-project', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          domain: claimDomain,
          token_address: claimToken,
          name: claimName,
          ticker: claimTicker
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setClaimResult(data);
        throw new Error(data.note || data.error || 'Project claim failed');
      }
      setClaimResult(data);
      await auth.refreshAccount();
      if (onSuccess) onSuccess(data);
      else navigate(`/project/${data.project.domain}`);
    } catch (err) {
      setClaimError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="login-box">
      <form onSubmit={submitClaim}>
        <p>Enter the project domain and Base token contract. Add the generated TXT record in DNS before submitting the claim.</p>
        {!auth.authenticated ? (
          <button className="button primary" type="button" onClick={auth.login} disabled={!auth.ready}>
            Log in with Privy
          </button>
        ) : null}
        <div className="input-box">
          <Globe2 size={18} />
          <input
            placeholder="yourdomain.com"
            value={claimDomain}
            onChange={(e) => {
              setClaimDomain(e.target.value);
              resetDnsCheck();
            }}
            required
          />
        </div>
        <div className="input-box">
          <WalletCards size={18} />
          <input
            placeholder="0x token contract"
            value={claimToken}
            onChange={(e) => {
              setClaimToken(e.target.value);
              resetDnsCheck();
            }}
            required
          />
        </div>
        <div className="claim-fields">
          <input
            placeholder="Project name"
            value={claimName}
            onChange={(e) => setClaimName(e.target.value)}
          />
          <input
            placeholder="Ticker"
            value={claimTicker}
            onChange={(e) => setClaimTicker(e.target.value)}
          />
        </div>
        <div className="txt-record">
          <div>
            <span>DNS TXT record</span>
            <textarea
              readOnly
              value={claimResult?.expected_record || expectedRecord}
              placeholder="Enter domain and token contract to generate the TXT record."
            />
          </div>
          <button
            type="button"
            onClick={copyExpectedRecord}
            aria-label="Copy DNS TXT record"
            disabled={!expectedRecord}
          >
            <ClipboardCopy size={17} />
          </button>
        </div>
        <p className="form-note">
          {recordCopied ? 'TXT record copied. Add it to DNS, then verify.' : 'Add this as a TXT record on the domain itself, then wait for DNS propagation.'}
        </p>
        <button
          className="button secondary verify-dns-button"
          type="button"
          onClick={verifyDnsRecord}
          disabled={dnsVerifying || !expectedRecord}
        >
          {dnsVerifying ? 'Verifying DNS...' : dnsVerified ? 'DNS Verified' : 'Verify DNS TXT'}
        </button>
        {dnsMessage ? (
          <p className={dnsVerified ? 'success-text' : 'error-text'}>{dnsMessage}</p>
        ) : null}
        {claimError && <p className="error-text">{claimError}</p>}
        <button className="button primary" type="submit" disabled={verifying || !auth.authenticated || !dnsVerified}>
          {verifying ? 'Claiming Project...' : 'Claim Project'}
        </button>
      </form>
      <div className="login-info">
        <UserCheck size={24} />
        <p>A 403 response means CLEARO reached the API, but DNS does not yet contain the required TXT record for this domain and token.</p>
      </div>
    </div>
  );
}

function ProfilePage({ domain, navigate, auth }) {
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const isOwner = auth.account.projects.some((project) => project.domain.toLowerCase() === domain.toLowerCase());

  // Form states for adding claims
  const [claimType, setClaimType] = useState('whitepaper');
  const [claimLabel, setClaimLabel] = useState('Whitepaper');
  const [claimValue, setClaimValue] = useState('');
  const [claimDetails, setClaimDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [walletError, setWalletError] = useState('');
  const userWalletAddress = getUserWalletAddress(auth.user);

  useEffect(() => {
    loadProject();
  }, [domain]);

  async function loadProject() {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects?domain=${encodeURIComponent(domain)}`);
      if (!response.ok) throw new Error('Project not found');
      const data = await response.json();
      setProjectData(mapApiProject(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const addClaim = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setClaimError('');
    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/projects/${projectData.id}/claims`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          type: claimType, label: claimLabel, value: claimValue, details: claimDetails
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add claim');
      setProjectData(mapApiProject(data));
      setClaimValue('');
      setClaimDetails('');
    } catch (err) {
      setClaimError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyDevWallet = async () => {
    setWalletSubmitting(true);
    setWalletError('');
    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/projects/${projectData.id}/verify-wallet`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ wallet_address: userWalletAddress })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to verify developer wallet');
      setProjectData(mapApiProject(data.project));
    } catch (err) {
      setWalletError(err.message);
    } finally {
      setWalletSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading">SYNCHRONIZING REGISTRY...</div>;
  if (error) return (
    <main className="page">
      <Header navigate={navigate} auth={auth} />
      <div className="error-hero">
        <h1>404</h1>
        <p>{error}</p>
        <button className="button secondary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    </main>
  );

  return (
    <main className="page">
      <Header navigate={navigate} auth={auth} />
      
      <section className="hero">
        <div className="folio">{projectData.token.slice(0, 3)}</div>
        <div className="hero-main">
          <p className="section-label">{projectData.status}</p>
          <h1>{projectData.name}</h1>
          <p className="lede">{projectData.summary}</p>
          <div className="record-details-inline">
            <div className="inline-stat">
              <span>Contract</span>
              <strong>{shortAddress(projectData.tokenAddress)}</strong>
            </div>
            <div className="inline-stat">
              <span>Domain</span>
              <strong>{projectData.domain}</strong>
            </div>
            <div className="inline-stat">
              <span>Dev Wallet</span>
              <strong>{projectData.devWalletAddress ? shortAddress(projectData.devWalletAddress) : 'Not verified'}</strong>
            </div>
          </div>
        </div>
        <div className="hero-record">
          <div className="record-score">
            <span>Trust Score</span>
            <strong>{projectData.score}</strong>
          </div>
          <div className="record-row">
            <span>Verified At</span>
            <strong>{projectData.verifiedAt}</strong>
          </div>
          <div className="record-row">
            <span>Chain</span>
            <strong>Base Mainnet</strong>
          </div>
        </div>
      </section>

      <section className="claims">
        <div className="section-title">
          <p className="section-label">Claims Registry</p>
          <h2>Public project commitments.</h2>
        </div>
        <div className="claims-grid">
          <div className="claim-list">
            {projectData.claims.map(claim => <ClaimCard key={claim.id} claim={claim} />)}
          </div>
          <aside className="events">
            <p className="section-label">Evidence Log</p>
            {projectData.events.map((ev, i) => (
              <div key={i} className="event">
                <span>{i+1}</span>
                <p>{ev}</p>
              </div>
            ))}
          </aside>
        </div>
      </section>

      {isOwner ? (
        <section className="manage-section">
          <div className="section-title">
            <p className="section-label">Management console</p>
            <h2>Verify wallet and publish claims.</h2>
          </div>
          <div className="wallet-verify-panel">
            <div className="detail-head">
              <p className="owner-badge"><WalletCards size={14}/> Developer Wallet</p>
              <h3>{projectData.walletStatus === 'verified' ? 'Developer wallet verified.' : 'Add developer wallet verification.'}</h3>
              <p>
                DNS verification lists the project in Browse. Developer wallet verification raises the project to the stronger Domain + Wallet Verified status.
              </p>
            </div>
            <div className="wallet-verify-grid">
              <div className="inline-stat">
                <span>Current</span>
                <strong>{projectData.devWalletAddress ? shortAddress(projectData.devWalletAddress) : 'Missing'}</strong>
              </div>
              <div className="inline-stat">
                <span>Login Wallet</span>
                <strong>{userWalletAddress ? shortAddress(userWalletAddress) : 'No wallet linked'}</strong>
              </div>
              <button className="button primary" type="button" onClick={verifyDevWallet} disabled={walletSubmitting || !userWalletAddress || projectData.walletStatus === 'verified'}>
                {walletSubmitting ? 'Verifying...' : projectData.walletStatus === 'verified' ? 'Wallet Verified' : 'Verify Dev Wallet'}
              </button>
            </div>
            {walletError ? <p className="error-text">{walletError}</p> : null}
          </div>
          <form className="detail-form" onSubmit={addClaim}>
            <div className="detail-head">
               <p className="owner-badge"><Check size={14}/> Verified Owner</p>
               <h3>Authorized access to {domain} claims.</h3>
            </div>
            <label>
              <span>Type</span>
              <select value={claimType} onChange={(e) => setClaimType(e.target.value)}>
                <option value="whitepaper">Whitepaper</option>
                <option value="social">Social</option>
                <option value="wallet">Wallet</option>
                <option value="commitment">Commitment</option>
              </select>
            </label>
            <label>
              <span>Label</span>
              <input value={claimLabel} onChange={(e) => setClaimLabel(e.target.value)} required />
            </label>
            <label>
              <span>Value</span>
              <input value={claimValue} onChange={(e) => setClaimValue(e.target.value)} required />
            </label>
            <label className="wide-field">
              <span>Detailed Explanation</span>
              <input value={claimDetails} onChange={(e) => setClaimDetails(e.target.value)} />
            </label>
            <button className="button primary" type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Publish Claim'}
            </button>
            {claimError && <p className="error-text">{claimError}</p>}
          </form>
        </section>
      ) : (
        <section className="owner-footer">
          <ShieldAlert size={20} />
          <p>This profile is read-only. <a href="#login" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Log in and claim the project</a> to manage claims.</p>
        </section>
      )}
    </main>
  );
}

function DocsPage({ navigate, auth }) {
  const dnsRecord = 'clearo=v1 chain=base domain=test.com token=0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811';
  const authHeader = 'Authorization: Bearer <privy-access-token>';

  return (
    <main className="page">
      <Header navigate={navigate} auth={auth} />
      <section className="docs-hero">
        <div className="folio">DOCS</div>
        <div className="hero-main">
          <p className="section-label">Protocol Documentation</p>
          <h1>The CLEARO Operating Manual</h1>
          <p className="lede">
            How CLEARO verifies token domains, grants project access, and exposes registry data to humans and autonomous agents.
          </p>
        </div>
      </section>
      <section className="docs-section">
        <div className="section-title">
          <p className="section-label">Model</p>
          <h2>Identity, ownership, and registry data.</h2>
        </div>
        <div className="docs-content-wide">
          <article className="docs-article">
            <h3>What CLEARO verifies</h3>
            <p>
              CLEARO is a public registry for Base token identity. A project profile connects a token contract, a public domain, and the claims a project makes about itself.
            </p>
            <p>
              Account login and project ownership are separate. Privy manages the website session. DNS proves that the logged-in user controls the domain they want to manage.
            </p>
            <div className="docs-grid-simple">
              <div className="level-card">
                <strong>Login</strong>
                <p>Privy creates the website session with wallet, email, or X login. CLEARO does not auto-create an embedded wallet for login. The backend only accepts authenticated writes when a valid Privy access token is sent.</p>
              </div>
              <div className="level-card">
                <strong>Ownership</strong>
                <p>DNS TXT verification links a domain and token to the logged-in user. After that link exists, the user can manage that project profile.</p>
              </div>
              <div className="level-card">
                <strong>Developer wallet</strong>
                <p>After DNS claim, the owner can verify a browser or login wallet linked to the same session. This raises the project to Domain + Wallet Verified.</p>
              </div>
              <div className="level-card">
                <strong>Registry</strong>
                <p>Public read endpoints expose indexed project profiles, claim statuses, verification events, and cross-check results without requiring login.</p>
              </div>
            </div>
          </article>

          <article className="docs-article">
            <h3>Human owner flow</h3>
            <ol className="docs-ordered-list">
              <li>Log in with Privy using a wallet, email, or X account.</li>
              <li>Open <code>/claim</code> and enter the project domain, Base token contract, project name, and ticker.</li>
              <li>Copy the generated CLEARO DNS TXT record and publish it on the domain.</li>
              <li>Run <strong>Verify DNS TXT</strong>. The <strong>Claim Project</strong> button stays disabled until the DNS check passes.</li>
              <li>Claim the project. CLEARO creates or updates the project and links it to the logged-in user.</li>
              <li>Open the project profile and verify the developer wallet connected through the login session.</li>
              <li>Publish owner-managed claims such as official links, documentation, contract notes, or operational status.</li>
            </ol>
            <p>
              Owner-submitted claims are stored as <code>linked</code>. Stronger labels such as <code>dns_verified</code>, <code>wallet_verified</code>, or <code>monitored</code> are reserved for checks the platform can verify.
            </p>
          </article>
        </div>
      </section>

      <section className="docs-section alt">
        <div className="section-title">
          <p className="section-label">DNS</p>
          <h2>The domain proof record.</h2>
        </div>
        <div className="docs-content-wide">
          <article className="docs-article">
            <h3>TXT record format</h3>
            <p>
              Publish one TXT record on the project domain. The claim page generates a copy-ready value from the domain and token contract fields. CLEARO reads exact key/value pairs separated by spaces.
            </p>
            <p>
              In the DNS provider form, set <strong>Type</strong> to <code>TXT</code>, set <strong>Name</strong> or <strong>Host</strong> to <code>@</code>, and paste the generated CLEARO record into <strong>Content</strong> or <strong>Value</strong>. If the provider does not accept <code>@</code>, use the bare domain such as <code>test.com</code>. Do not use <code>_clearo</code>; CLEARO currently checks TXT records on the project domain itself.
            </p>
            <div className="api-block">
              <pre><code>{dnsRecord}</code></pre>
            </div>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Meaning</th>
                  <th>Current Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>clearo</code></td>
                  <td>Proof format version.</td>
                  <td><code>v1</code></td>
                </tr>
                <tr>
                  <td><code>chain</code></td>
                  <td>Network for the token contract.</td>
                  <td><code>base</code></td>
                </tr>
                <tr>
                  <td><code>domain</code></td>
                  <td>The domain being claimed.</td>
                  <td><code>test.com</code></td>
                </tr>
                <tr>
                  <td><code>token</code></td>
                  <td>The Base token contract address. Address comparison is case-insensitive.</td>
                  <td><code>0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811</code></td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>
      </section>

      <section className="docs-section">
        <div className="section-title">
          <p className="section-label">Data</p>
          <h2>Project profiles and claim status.</h2>
        </div>
        <div className="docs-content-wide">
          <article className="docs-article">
            <h3>Project shape</h3>
            <p>
              A project profile stores the domain, token contract, display name, ticker, trust score, current status, claim list, verification events, and cross-checks.
            </p>
            <div className="docs-grid-simple">
              <div className="level-card">
                <strong>claims</strong>
                <p>Owner or platform assertions shown on the project profile. Each claim has a label, details, and status.</p>
              </div>
              <div className="level-card">
                <strong>events</strong>
                <p>Timestamped verification history, including DNS checks, owner activity, and monitoring results.</p>
              </div>
              <div className="level-card">
                <strong>crossChecks</strong>
                <p>Independent comparison signals an agent should inspect before trusting an external link or claim.</p>
              </div>
            </div>
          </article>

          <article className="docs-article">
            <h3>Status vocabulary</h3>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>linked</code></td>
                  <td>The claim was submitted by an authenticated project owner.</td>
                </tr>
                <tr>
                  <td><code>dns_verified</code></td>
                  <td>CLEARO verified the DNS proof for the project domain.</td>
                </tr>
                <tr>
                  <td><code>wallet_signed</code></td>
                  <td>A wallet signature verified a wallet-controlled statement.</td>
                </tr>
                <tr>
                  <td><code>wallet_verified</code></td>
                  <td>The developer wallet is connected through the project owner login session.</td>
                </tr>
                <tr>
                  <td><code>monitored</code></td>
                  <td>The platform is watching the value or link for changes.</td>
                </tr>
                <tr>
                  <td><code>missing</code></td>
                  <td>The expected source, link, or proof was not found.</td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>
      </section>

      <section className="docs-section alt">
        <div className="section-title">
          <p className="section-label">API</p>
          <h2>Endpoints for users and agents.</h2>
        </div>
        <div className="docs-content-wide">
          <article className="docs-article">
            <h3>Public reads</h3>
            <p>
              Registry reads do not require login. Use them for discovery, profile lookups, agent analysis, and public verification.
            </p>
            <div className="docs-api-item">
              <h4>GET /api/registry/summary</h4>
              <div className="api-block">
                <pre><code>{`{
  "metrics": {
    "indexed_records": 1,
    "dns_verified": 1,
    "claims_watched": 5,
    "broken_claims": 0
  },
  "recent_projects": [
    {
      "domain": "test.com",
      "ticker": "TEST",
      "score": 95,
      "status": "Domain + Wallet Verified"
    }
  ]
}`}</code></pre>
              </div>
            </div>
            <div className="docs-api-item">
              <h4>GET /api/projects/verified</h4>
              <p>Returns the database-backed list used by the Browse page at <code>/browse</code>. Only DNS-verified projects are included.</p>
              <div className="api-block">
                <pre><code>{`{
  "projects": [
    {
      "domain": "test.com",
      "name": "Test Project",
      "ticker": "TEST",
      "token_address": "0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811",
      "chain": "base",
      "score": 95,
      "status": "Domain + Wallet Verified"
    }
  ]
}`}</code></pre>
              </div>
            </div>
            <div className="docs-api-item">
              <h4>GET /api/projects?domain=test.com</h4>
              <p>Returns one project profile by domain.</p>
            </div>
            <div className="docs-api-item">
              <h4>GET /api/projects?token=0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811</h4>
              <p>Returns one project profile by Base token contract.</p>
            </div>
            <div className="docs-api-item">
              <h4>POST /api/verify/dns</h4>
              <p>Checks whether the expected TXT record is visible for the submitted domain and token. The claim page uses this response to unlock the final claim button.</p>
              <div className="api-block">
                <pre><code>{`{
  "matched": true,
  "record": "clearo=v1 chain=base domain=test.com token=0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811",
  "status": "verified"
}`}</code></pre>
              </div>
            </div>
          </article>

          <article className="docs-article">
            <h3>Authenticated writes</h3>
            <p>
              Writes require a Privy access token from the logged-in user. Send it as <code>{authHeader}</code>.
            </p>
            <div className="docs-api-item">
              <h4>GET /api/auth/me</h4>
              <div className="api-block">
                <pre><code>{`curl https://clearo.dev/api/auth/me \\
  -H "Authorization: Bearer <privy-access-token>"`}</code></pre>
              </div>
            </div>
            <div className="docs-api-item">
              <h4>POST /api/auth/claim-project</h4>
              <p>Claim is intended to run after <code>POST /api/verify/dns</code> returns <code>matched: true</code>.</p>
              <div className="api-block">
                <pre><code>{`{
  "domain": "test.com",
  "token_address": "0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811",
  "name": "Test Project",
  "ticker": "TEST"
}`}</code></pre>
              </div>
            </div>
            <div className="docs-api-item">
              <h4>POST /api/projects/:id/verify-wallet</h4>
              <p>Requires project owner access. The wallet must be connected through the logged-in session. DNS-only projects are listed, but wallet verification raises the trust score and status.</p>
              <div className="api-block">
                <pre><code>{`{
  "wallet_address": "0x742d35cc6634c0532925a3b844bc454e4438f44e"
}`}</code></pre>
              </div>
            </div>
            <div className="docs-api-item">
              <h4>POST /api/projects/:id/claims</h4>
              <div className="api-block">
                <pre><code>{`{
  "label": "Official whitepaper",
  "value": "https://test.com/whitepaper.pdf",
  "details": "Primary project documentation published by the owner."
}`}</code></pre>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="docs-section">
        <div className="section-title">
          <p className="section-label">Agents</p>
          <h2>How automation should use CLEARO.</h2>
        </div>
        <div className="docs-content-wide">
          <article className="docs-article">
            <h3>Read first, write only with owner access</h3>
            <div className="agent-note">
              <p>Agents should treat CLEARO as a verification source, not as proof that every external statement is true. Trust the status field and cross-checks, not a label alone.</p>
            </div>
            <ol className="docs-ordered-list">
              <li>Read <code>/api/registry/summary</code> for metrics or <code>/api/projects/verified</code> to browse verified projects.</li>
              <li>Read <code>/api/projects?domain=...</code> or <code>/api/projects?token=...</code> before using a project link, whitepaper, or contract claim.</li>
              <li>Inspect <code>claims</code>, <code>events</code>, and <code>crossChecks</code> together before making a decision.</li>
              <li>Use authenticated write endpoints only when the human owner has issued a valid Privy access token for that session.</li>
              <li>Handle <code>401</code>, <code>403</code>, and <code>404</code> explicitly. Do not retry a write as a different identity unless the owner asked for that.</li>
            </ol>
            <p>
              The current authorization model is owner session based. Scoped API keys can be added later, but today the backend authorizes writes through Privy plus the project owner link in the database.
            </p>
          </article>
        </div>
      </section>

    </main>
  );
}

// Sub-components
function Metric({ number, label }) {
  return <div className="metric"><strong>{number}</strong><span>{label}</span></div>;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function useDecryptOnView() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nodes = Array.from(document.querySelectorAll('.decrypt-text'));
    const revealed = new WeakSet();

    const reveal = (node) => {
      if (revealed.has(node)) return;
      revealed.add(node);
      const finalText = node.dataset.text || node.textContent || '';
      let frame = 0;
      const totalFrames = 18;
      const interval = window.setInterval(() => {
        const progress = frame / totalFrames;
        node.textContent = finalText
          .split('')
          .map((char, index) => {
            if (char === ' ' || index / finalText.length < progress) return char;
            return SCRAMBLE_CHARS[(index + frame) % SCRAMBLE_CHARS.length];
          })
          .join('');
        frame += 1;
        if (frame > totalFrames) {
          window.clearInterval(interval);
          node.textContent = finalText;
          node.classList.add('is-decrypted');
        }
      }, 32);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.35 });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function ClaimCard({ claim }) {
  const status = claim.status || 'unverified';
  const icon = ['verified', 'dns_verified', 'wallet_signed', 'wallet_verified', 'linked'].includes(status) ? <Check size={18} /> : <Clock3 size={18} />;
  return (
    <div className="claim-card">
      <span className={status}>{icon}</span>
      <div>
        <strong>{claim.label}</strong>
        <p>{claim.details || claim.value}</p>
      </div>
    </div>
  );
}

function PrivySetupMissing() {
  return (
    <main className="page">
      <div className="error-hero">
        <h1>CLEARO</h1>
        <p>Set <code>VITE_PRIVY_APP_ID</code> to enable Privy login.</p>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
