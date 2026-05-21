# CLEARO

CLEARO is a public registry for Base token identity. A project profile connects a token contract, a public domain, owner-managed claims, DNS ownership proof, and optional developer wallet verification.

Production site: https://clearo.dev

## What CLEARO Verifies

Account login and project ownership are separate.

- Login: Privy manages the website session with wallet, email, or X login. CLEARO does not auto-create embedded wallets for login.
- Ownership: DNS TXT verification proves that the logged-in user controls the domain they want to manage.
- Developer wallet: after DNS claim, the owner can verify a browser or login wallet connected through the same session. This raises the project to `Domain + Wallet Verified`.
- Registry: public read endpoints expose verified project profiles, claim statuses, verification events, and cross-check results without login.

## Owner Flow

1. Log in with Privy using wallet, email, or X.
2. Open `/claim`.
3. Enter the project domain, Base token contract, project name, and ticker.
4. Publish the generated CLEARO DNS TXT record on the project domain.
5. Run `Verify DNS TXT`.
6. Claim the project after DNS verification passes.
7. Open the project profile and verify the developer wallet connected through the login session.
8. Publish owner-managed claims such as official links, documentation, contract notes, or operational status.

Owner-submitted claims are stored as `linked`. Stronger labels such as `dns_verified`, `wallet_verified`, or `monitored` are reserved for checks the platform can verify.

## DNS TXT Record

Publish one TXT record on the project domain. CLEARO reads exact key/value pairs separated by spaces.

```txt
clearo=v1 chain=base domain=test.com token=0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811
```

DNS provider fields:

- `Type`: `TXT`
- `Name` or `Host`: `@`
- `Content` or `Value`: the generated CLEARO record
- If the provider does not accept `@`, use the bare domain such as `test.com`
- Do not use `_clearo`; CLEARO currently checks TXT records on the project domain itself

Record keys:

- `clearo`: proof format version, currently `v1`
- `chain`: token network, currently `base`
- `domain`: domain being claimed
- `token`: Base token contract address, compared case-insensitively

## Project Data

A project profile stores:

- Domain
- Base token contract
- Display name
- Ticker
- Trust score
- Current verification status
- Claim list
- Verification events
- Cross-checks
- Optional developer wallet address

Status vocabulary:

- `linked`: claim was submitted by an authenticated project owner
- `dns_verified`: CLEARO verified DNS proof for the project domain
- `wallet_signed`: a wallet signature verified a wallet-controlled statement
- `wallet_verified`: developer wallet is connected through the project owner login session
- `monitored`: the platform is watching the value or link for changes
- `missing`: the expected source, link, or proof was not found

## API

Public reads do not require login.

### `GET /api/registry/summary`

Returns registry metrics and recent projects.

```json
{
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
}
```

### `GET /api/projects/verified`

Returns the database-backed list used by `/browse`. Only DNS-verified projects are included.

### `GET /api/projects?domain=test.com`

Returns one project profile by domain.

### `GET /api/projects?token=0x...`

Returns one project profile by Base token contract.

### `POST /api/verify/dns`

Checks whether the expected TXT record is visible for the submitted domain and token.

```json
{
  "matched": true,
  "record": "clearo=v1 chain=base domain=test.com token=0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811",
  "status": "verified"
}
```

Authenticated writes require a Privy access token:

```http
Authorization: Bearer <privy-access-token>
```

### `GET /api/auth/me`

Returns the logged-in user and owned projects.

### `POST /api/auth/claim-project`

Claims a project after `POST /api/verify/dns` returns `matched: true`.

```json
{
  "domain": "test.com",
  "token_address": "0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811",
  "name": "Test Project",
  "ticker": "TEST"
}
```

### `POST /api/projects/:id/verify-wallet`

Requires project owner access. The wallet must be connected through the logged-in session. DNS-only projects are listed, but wallet verification raises the trust score and status.

```json
{
  "wallet_address": "0x742d35cc6634c0532925a3b844bc454e4438f44e"
}
```

### `POST /api/projects/:id/claims`

Adds an owner-managed claim.

```json
{
  "label": "Official whitepaper",
  "value": "https://test.com/whitepaper.pdf",
  "details": "Primary project documentation published by the owner."
}
```

## Agent Guidance

Agents should treat CLEARO as a verification source, not as proof that every external statement is true. Trust the status field and cross-checks, not a label alone.

1. Read `/api/registry/summary` for metrics or `/api/projects/verified` to browse verified projects.
2. Read `/api/projects?domain=...` or `/api/projects?token=...` before using a project link, whitepaper, or contract claim.
3. Inspect `claims`, `events`, and `crossChecks` together before making a decision.
4. Use authenticated write endpoints only when the human owner has issued a valid Privy access token for that session.
5. Handle `401`, `403`, and `404` explicitly.

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:

```env
VITE_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
```

Run the frontend:

```bash
npm run dev
```

Run the API:

```bash
npm run api
```

Build production assets:

```bash
npm run build
```

## Deployment Notes

This server currently runs:

- Node API from `server.js`
- SQLite database in `data/clearo.sqlite`
- Vite production build in `dist/`
- Nginx config in `deploy/nginx-clearo.dev.conf`
- systemd service in `deploy/clearo-api.service`

Runtime files are intentionally ignored by git:

- `.env`
- `data/`
- `dist/`
- `node_modules/`
