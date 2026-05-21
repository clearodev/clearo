# CLEARO

**A public verification registry for Base token identity.**

CLEARO links a token contract to an owned domain, public project claims, DNS proof, and optional developer wallet verification. The goal is simple: give users and agents a readable source of truth before they trust a token website, whitepaper, claim, or project link.

[clearo.dev](https://clearo.dev)

## Overview

Most token identity is scattered across websites, social profiles, contracts, wallets, and launch metadata. CLEARO turns the strongest project-controlled signals into a small public registry:

| Layer | What it proves | How it works |
| --- | --- | --- |
| Login | Who is using the website | Privy session with wallet, email, or X login |
| Domain ownership | The owner controls the public project domain | DNS TXT proof on the claimed domain |
| Developer wallet | A wallet signs a CLEARO challenge from the owner session | Wallet verification after DNS claim |
| Registry data | Public claims and verification history | Readable project profile and API endpoints |

Privy is used for login and session management only. CLEARO does not auto-create embedded wallets for users.

## Product Flow

1. A project owner logs in with Privy.
2. They open `/claim` and enter a domain, Base token contract, project name, and ticker.
3. CLEARO generates a DNS TXT record.
4. The owner publishes that TXT record on the project domain.
5. CLEARO verifies DNS before enabling the final claim action.
6. The project profile becomes visible in `/browse`.
7. The owner can verify a developer wallet by signing a CLEARO challenge from that wallet.
8. The owner can publish claims such as official documentation, links, wallet notes, or operating statements.

DNS-only projects are listed publicly. Developer wallet verification raises the project to a stronger `Domain + Wallet Verified` status.

## DNS Verification

CLEARO verifies ownership through a TXT record on the project domain.

```txt
clearo=v1 chain=base domain=test.com token=0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811
```

Use these DNS provider fields:

| Field | Value |
| --- | --- |
| Type | `TXT` |
| Name / Host | `@` |
| Content / Value | Generated CLEARO record |

If the DNS provider rejects `@`, use the bare domain, for example `test.com`.

Do not use `_clearo`. The current verifier checks TXT records directly on the project domain.

## Verification Model

Project profiles include a trust score and status vocabulary that agents can inspect.

| Status | Meaning |
| --- | --- |
| `linked` | Claim was submitted by an authenticated project owner |
| `dns_verified` | CLEARO verified DNS proof for the project domain |
| `wallet_signed` | A wallet signature verified a wallet-controlled statement |
| `wallet_verified` | Developer wallet signed a CLEARO challenge from the project owner session |
| `monitored` | CLEARO is watching the value or link for changes |
| `missing` | Expected source, link, or proof was not found |

A project profile stores the domain, Base token contract, display name, ticker, trust score, verification status, claims, events, cross-checks, and optional developer wallet address.

## API

Public reads do not require login.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/.well-known/clearo-agent.json` | Site-level manifest for agents |
| `GET` | `/llms.txt` | Plain-text agent and LLM entrypoint |
| `GET` | `/api/agent/actions` | Machine-readable read/write action schema |
| `GET` | `/api/registry/summary` | Registry metrics and recent projects |
| `GET` | `/api/projects/verified` | DNS-verified projects used by `/browse` |
| `GET` | `/api/projects?domain=test.com` | One project profile by domain |
| `GET` | `/api/projects?token=0x...` | One project profile by Base token contract |
| `GET` | `/api/projects/:id` | One project profile by registry ID |
| `GET` | `/api/projects/:id/agent.json` | Machine-readable profile for agents |
| `POST` | `/api/verify/dns` | Check whether a CLEARO DNS TXT record is visible |

Authenticated writes require a Privy access token:

```http
Authorization: Bearer <privy-access-token>
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/me` | Logged-in user and owned projects |
| `POST` | `/api/auth/claim-project` | Claim a DNS-verified project |
| `POST` | `/api/projects/:id/wallet-challenge` | Create a developer wallet signature challenge |
| `POST` | `/api/projects/:id/verify-wallet` | Verify the signed developer wallet challenge |
| `POST` | `/api/projects/:id/claims` | Add an owner-managed claim |

### DNS Check

```json
{
  "matched": true,
  "record": "clearo=v1 chain=base domain=test.com token=0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811",
  "status": "verified",
  "contract": {
    "status": "verified",
    "name": "Test Project",
    "symbol": "TEST",
    "decimals": 18
  }
}
```

### Claim Project

```json
{
  "domain": "test.com",
  "token_address": "0x5f4c2a8b9d1337c1ea992cf0037b219ca8f2d811",
  "name": "Test Project",
  "ticker": "TEST"
}
```

### Verify Developer Wallet

```json
{
  "wallet_address": "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  "nonce": "challenge-nonce",
  "signature": "0x..."
}
```

### Add Claim

```json
{
  "type": "gitlawb_agent",
  "label": "GitLawb agent profile",
  "value": "https://gitlawb.com/agent-id",
  "details": "GitLawb DID profile or signed repository for agents."
}
```

## Agent Use

Agents should treat CLEARO as a verification source, not as proof that every external statement is true. Prefer status fields, cross-checks, and event history over a claim label alone.

Start from `/.well-known/clearo-agent.json` or `/llms.txt` when discovering CLEARO programmatically. Those entrypoints describe Base chain ID `8453`, the DNS TXT proof format, project lookup templates, safe public reads, owner-authenticated writes, and agent-relevant claim types such as `github`, `gitlawb_agent`, `agent_profile`, `api_schema`, and `docs`.

Recommended agent workflow:

1. Read `/api/registry/summary` or `/api/projects/verified`.
2. Read `/api/projects?domain=...`, `/api/projects?token=...`, or `/api/projects/:id/agent.json` before trusting a project link, whitepaper, or contract claim.
3. Inspect `proofs`, `contract`, `claims`, `events`, and `crossChecks` together.
4. Use authenticated writes only when a human owner has supplied a valid Privy access token.
5. Handle `400`, `401`, `403`, `404`, `413`, `422`, and `429` explicitly.

## Tech Stack

| Area | Stack |
| --- | --- |
| Frontend | React, Vite, TypeScript-capable TSX components, lucide-react, framer-motion |
| Authentication | Privy React + Node SDK |
| API | Node.js HTTP server |
| Database | SQLite |
| Deployment | Nginx, systemd |

## Component Structure

Reusable UI components live in `components/ui/`. The Vite `@/` alias points at the repository root, so imports such as `@/components/ui/etheral-shadow` resolve correctly.

Global app styles currently live in `src/styles.css`. This project does not currently include Tailwind CSS or a shadcn `components.json`; it keeps the production UI on the existing CSS system. If shadcn/Tailwind components become a regular part of the app, initialize them with:

```bash
npx shadcn@latest init
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Keeping `components/ui/` matters because shadcn components, generated imports, and external component snippets commonly assume that path.

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

Required environment variables:

```env
VITE_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
HOST=127.0.0.1
PORT=3101
BASE_RPC_URL=https://mainnet.base.org
PUBLIC_ORIGIN=https://clearo.dev
```

The API rate-limits write-like endpoints, caps JSON request bodies, checks token contracts on Base, and periodically rechecks DNS proofs. Optional runtime knobs are documented in `.env.example`.

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

## Repository Layout

```txt
.
├── public/
│   └── logo.png
├── src/
│   ├── main.jsx
│   └── styles.css
├── index.html
├── server.js
├── vite.config.js
└── package.json
```

## Runtime Notes

The API runs from `server.js`, the frontend builds into `dist/`, and runtime registry data is stored in SQLite under `data/`.

Runtime files are intentionally excluded from git:

```txt
.env
data/
deploy/
dist/
node_modules/
```
