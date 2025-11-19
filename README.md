# 🔍 Clearo - Transparency Platform

<div align="center">

**A decentralized transparency platform built on Solana that enables projects to verify ownership, publish transparency materials, and receive community votes.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-14F46B?logo=solana&logoColor=white)](https://solana.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

</div>

---

## 📖 About

Clearo is a blockchain-based transparency platform that empowers projects to build trust with their communities through verifiable ownership, comprehensive documentation, and community-driven voting. Built on Solana, Clearo leverages smart contracts to ensure immutable verification and transparent governance.

## ✨ Features

### 🔐 Project Ownership Verification
Projects can verify their ownership on-chain by burning CLRO tokens (500 tokens required). This creates an immutable proof of ownership stored on the Solana blockchain, preventing impersonation and ensuring authenticity.

### 📄 Transparency Profiles
Projects can create comprehensive transparency profiles by uploading various documents including:
- Whitepapers
- Roadmaps
- Security audits
- Financial reports
- Governance documents

All documents are hashed and stored immutably, ensuring integrity and preventing tampering.

### 👍👎 Token-Gated Voting
Community members can vote on projects using a token-gated system where 10 CLRO tokens equal 1 vote. This ensures that votes come from invested community members and prevents spam. Tokens are burned during voting, making each vote meaningful and costly to manipulate.

### 📊 Transparency Score
An automated scoring system calculates each project's transparency score based on multiple factors:
- **User Votes (25%)** - Community sentiment and engagement
- **Documentation Quality (50%)** - Completeness and variety of documents
- **Project Updates (15%)** - Recent activity and communication
- **On-Chain Activity (10%)** - Verification status and blockchain interactions

### 🎖 Project Badges
Projects receive embeddable badges that display their transparency score. Badges are automatically updated and can be embedded on websites, GitHub repositories, or documentation pages to showcase transparency credentials.

### 🔗 Wallet Integration
Seamless integration with Solana wallets including Phantom, Solflare, and other popular wallets. Users can connect their wallets to verify projects, vote, and manage their profiles.

### 📧 Email Authentication
Traditional email-based authentication system for users who prefer not to use wallets, with secure email verification and password reset functionality.

## 🏗️ Architecture

Clearo is built as a full-stack decentralized application with three main components:

### 1. Solana Smart Contracts (Anchor Programs)

**Verification Program**
- Generates unique verification codes
- Validates token transfers with verification codes
- Stores verification state on-chain

**Registry Program**
- Registers new projects
- Stores project metadata
- Manages document hashes
- Updates verification status
- Tracks transparency scores

**Voting Program**
- Handles token-gated voting
- Burns tokens during voting
- Records votes on-chain
- Supports vote changes

### 2. Backend API (Node.js/Express)

The backend serves as the bridge between the blockchain and frontend, handling:
- Document upload and storage
- Transparency score calculation
- Off-chain data indexing
- User authentication (email and wallet-based)
- API rate limiting and security
- Database management (PostgreSQL)

### 3. Frontend Application (Next.js/React)

A modern, responsive web application featuring:
- Project discovery and browsing
- Project verification flow
- Document upload interface
- Voting interface
- Badge widget for embedding
- Wallet connection and management
- User profiles and authentication

## 🛠️ Tech Stack

### Blockchain Layer
- **Solana** - High-performance blockchain with fast, low-cost transactions
- **Anchor Framework** - Development framework for Solana programs
- **@solana/web3.js** - JavaScript SDK for Solana interactions

### Frontend
- **Next.js 14** - React framework with App Router and server-side rendering
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Solana Wallet Adapter** - Wallet integration library

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **TypeScript** - Type-safe backend development
- **PostgreSQL** - Relational database for off-chain data
- **JWT** - Secure authentication tokens
- **Multer** - File upload handling

## 📁 Project Structure

```
clearo/
├── programs/              # Solana Anchor programs
│   ├── verification/      # Verification program
│   ├── registry/          # Registry program
│   └── voting/            # Voting program
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── db/            # Database setup
│   │   └── utils/         # Utility functions
│   └── package.json
├── frontend/              # Next.js application
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   └── package.json
└── scripts/               # Utility scripts
```

## 🔌 API Overview

The backend provides RESTful APIs for:

- **Projects** - CRUD operations, filtering, search
- **Documents** - Upload, retrieval, deletion
- **Voting** - Vote recording and statistics
- **Scoring** - Transparency score calculation
- **Authentication** - Email and wallet-based auth
- **Profiles** - User and wallet profile management

## 📊 Transparency Scoring System

The transparency score is a weighted calculation that evaluates multiple aspects of a project:

### Score Components

- **User Votes (25%)** - Ratio of upvotes to downvotes from the community
- **Documentation Quality (50%)** - Presence and variety of transparency documents
- **Project Updates (15%)** - Frequency and recency of project activity
- **On-Chain Activity (10%)** - Verification status and blockchain interactions

### Badge Levels

Projects are assigned badges based on their transparency score:

- 💎 **Diamond** (90-100) - Exceptional transparency and community trust
- ⭐ **Platinum** (75-89) - High transparency standards
- 🥇 **Gold** (60-74) - Good transparency practices
- 🥈 **Silver** (45-59) - Moderate transparency
- 🥉 **Bronze** (30-44) - Basic transparency
- ⚠️ **Unverified** (<30) - Needs improvement

## 🔒 Security Features

- **Rate Limiting** - API endpoints are protected against abuse
- **JWT Authentication** - Secure token-based authentication
- **File Upload Validation** - Type and size restrictions on uploads
- **CORS Protection** - Configurable cross-origin resource sharing
- **Helmet.js** - Security headers for HTTP protection
- **Input Validation** - Request validation and sanitization
- **On-Chain Verification** - Immutable proof of ownership on blockchain

## 🔄 How It Works

### Verification Flow

1. Project owner connects their Solana wallet
2. System generates a unique verification code
3. Owner burns 500 CLRO tokens with the verification code in the transaction memo
4. Backend verifies the transaction on-chain
5. Project is marked as verified with immutable proof

### Voting Flow

1. Community member connects wallet
2. Member selects upvote or downvote
3. System creates transaction to burn 10 CLRO tokens per vote
4. Vote is recorded on-chain via the voting program
5. Backend indexes the vote and recalculates transparency score
6. Project badge updates automatically

### Document Management

1. Project owner uploads transparency documents
2. Documents are stored securely with hash verification
3. Document metadata is stored in the database
4. Document hashes can be verified against blockchain records
5. Documents contribute to transparency score calculation

## 📝 Documentation

For detailed documentation, see:

- [Architecture Documentation](./ARCHITECTURE.md) - System architecture and design decisions
- [Project Summary](./PROJECT_SUMMARY.md) - Feature overview and project status
- [GitHub Setup Guide](./GITHUB_SETUP.md) - Setup and configuration guide
- [Production Setup](./PRODUCTION_SETUP.md) - Production deployment guide

## 🤝 Contributing

Contributions are welcome! This project is open source and we encourage community participation. Please see our contributing guidelines for more information.

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with the following amazing technologies:

- [Solana](https://solana.com/) - High-performance blockchain
- [Anchor](https://www.anchor-lang.com/) - Solana framework
- [Next.js](https://nextjs.org/) - React framework
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

---

<div align="center">

**Built with ❤️ on Solana**

[⭐ Star this repo](https://github.com/clearodev/clearo) | [🐛 Report Bug](https://github.com/clearodev/clearo/issues) | [💡 Request Feature](https://github.com/clearodev/clearo/issues)

</div>
