# 🔍 Clearo - Transparency Platform

<div align="center">

**A decentralized transparency platform built on Solana that enables projects to verify ownership, publish transparency materials, and receive community votes.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-14F46B?logo=solana&logoColor=white)](https://solana.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

</div>

---

## ✨ Features

- 🔐 **Project Ownership Verification** - On-chain verification using token burn (500 CLRO tokens)
- 📄 **Transparency Profiles** - Upload whitepapers, roadmaps, audits, and other transparency documents
- 👍👎 **Token-Gated Voting** - Community voting system (10 CLRO tokens = 1 vote)
- 📊 **Transparency Score** - Automated scoring based on votes, documentation, updates, and on-chain activity
- 🎖 **Project Badges** - Embeddable badges that display transparency scores
- 🔗 **Wallet Integration** - Seamless Solana wallet connection (Phantom, Solflare, and more)
- 📧 **Email Verification** - Secure email-based authentication and verification
- 🛡️ **Security First** - Rate limiting, JWT authentication, and secure file uploads

## 🏗️ Architecture

Clearo consists of three main components:

1. **Solana Smart Contracts** (Anchor programs)
   - Verification Program - Handles project ownership verification
   - Registry Program - Stores project metadata and document hashes
   - Voting Program - Token-gated voting system

2. **Backend API** (Node.js/Express)
   - RESTful API for project management
   - Document upload and storage
   - Transparency score calculation
   - Database management (PostgreSQL)

3. **Frontend Application** (Next.js/React)
   - Modern, responsive UI
   - Wallet integration
   - Project verification flow
   - Voting interface
   - Badge widget

## 🛠️ Tech Stack

### Blockchain
- **Solana** - High-performance blockchain
- **Anchor** - Framework for Solana programs
- **@solana/web3.js** - Solana JavaScript SDK

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Solana Wallet Adapter** - Wallet integration

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **Multer** - File upload handling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Rust** 1.70+ ([Install](https://www.rust-lang.org/tools/install))
- **Anchor CLI** 0.29+ ([Install](https://www.anchor-lang.com/docs/installation))
- **Solana CLI** 1.18+ ([Install](https://docs.solana.com/cli/install-solana-cli-tools))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/clearo.git
cd clearo
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Set Up Environment Variables

#### Backend Configuration

```bash
# Copy the example environment file
cp env.example .env
```

Edit `.env` and configure:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clearo
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Secret (generate a strong random string)
JWT_SECRET=your_jwt_secret_here

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com

# Frontend URL
FRONTEND_URL=http://localhost:3002

# Email Configuration (choose one)
# Option 1: Resend API
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=noreply@yourdomain.com

# Option 2: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_email_password
SMTP_FROM=noreply@yourdomain.com
```

#### Frontend Configuration

```bash
# Copy the example environment file
cp frontend/env.example frontend/.env.local
```

Edit `frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Solana RPC URL
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Solana Program Addresses (update after deploying programs)
NEXT_PUBLIC_VERIFICATION_ADDRESS=your_verification_program_id
NEXT_PUBLIC_CLRO_TOKEN_MINT=your_clro_token_mint_address
```

### 4. Set Up Database

```bash
# Create PostgreSQL database
createdb clearo

# Or using psql
psql -U postgres
CREATE DATABASE clearo;
```

The database tables will be created automatically on first backend startup.

### 5. Build Solana Programs

```bash
# Build all Anchor programs
anchor build

# Deploy to devnet (optional)
anchor deploy --provider.cluster devnet
```

### 6. Start Development Servers

#### Terminal 1: Backend

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3001`

#### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3002`

## 📁 Project Structure

```
clearo/
├── programs/              # Solana Anchor programs
│   ├── verification/      # Verification program
│   ├── registry/          # Registry program
│   └── voting/            # Voting program
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   │   ├── auth.ts    # Authentication routes
│   │   │   ├── projects.ts
│   │   │   ├── documents.ts
│   │   │   ├── voting.ts
│   │   │   ├── scoring.ts
│   │   │   └── walletAuth.ts
│   │   ├── services/      # Business logic
│   │   │   ├── email.ts
│   │   │   └── scoring.ts
│   │   ├── middleware/    # Express middleware
│   │   ├── db/            # Database setup
│   │   └── utils/         # Utility functions
│   └── package.json
├── frontend/              # Next.js application
│   ├── app/               # Next.js app directory
│   │   ├── page.tsx       # Landing page
│   │   ├── projects/      # Project pages
│   │   ├── verify/        # Verification flow
│   │   └── badge/         # Badge widget
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   └── package.json
├── scripts/               # Utility scripts
├── Anchor.toml            # Anchor configuration
├── .gitignore
├── env.example            # Backend environment template
└── README.md
```

## 🔌 API Endpoints

### Projects

- `GET /api/projects` - List all projects (with filters)
- `GET /api/projects/:projectId` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/:projectId` - Update project
- `POST /api/projects/:projectId/logo` - Upload project logo

### Documents

- `GET /api/documents/project/:projectId` - Get project documents
- `POST /api/documents/upload` - Upload document
- `DELETE /api/documents/:id` - Delete document

### Voting

- `GET /api/voting/project/:projectId` - Get vote statistics
- `POST /api/voting/vote` - Record vote

### Scoring

- `POST /api/scoring/calculate/:projectId` - Calculate transparency score

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Wallet Authentication

- `POST /api/wallet/login` - Login with wallet
- `GET /api/wallet/profile` - Get wallet profile
- `POST /api/wallet/profile` - Update wallet profile

## 📊 Transparency Scoring

The transparency score is calculated from multiple factors:

- **User Votes (25%)** - Community sentiment (upvotes vs downvotes)
- **Documentation Quality (50%)** - Document types and completeness
- **Project Updates (15%)** - Recent activity and engagement
- **On-Chain Activity (10%)** - Verification status and blockchain activity

### Badge Levels

- 💎 **Diamond** (90-100) - Exceptional transparency
- ⭐ **Platinum** (75-89) - High transparency
- 🥇 **Gold** (60-74) - Good transparency
- 🥈 **Silver** (45-59) - Moderate transparency
- 🥉 **Bronze** (30-44) - Basic transparency
- ⚠️ **Unverified** (<30) - Needs improvement

## 🔒 Security

- **Rate Limiting** - Prevents API abuse
- **JWT Authentication** - Secure token-based auth
- **File Upload Validation** - Type and size restrictions
- **CORS Protection** - Configurable origin restrictions
- **Helmet.js** - Security headers
- **Input Validation** - Request validation and sanitization

## 🧪 Testing

```bash
# Test Solana programs
anchor test

# Run backend tests (if available)
cd backend
npm test

# Run frontend tests (if available)
cd frontend
npm test
```

## 📦 Production Deployment

### Using PM2

1. Copy `ecosystem.config.js.example` to `ecosystem.config.js`
2. Configure environment variables in the ecosystem file
3. Build the applications:

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build
```

4. Start with PM2:

```bash
pm2 start ecosystem.config.js
```

### Environment Variables

Ensure all production environment variables are set:
- Database credentials
- JWT secret
- Solana RPC URL (mainnet)
- Email service credentials
- Frontend URL

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📝 Documentation

- [Architecture Documentation](./ARCHITECTURE.md)
- [Project Summary](./PROJECT_SUMMARY.md)
- [GitHub Setup Guide](./GITHUB_SETUP.md)
- [Production Setup](./PRODUCTION_SETUP.md)

## 🐛 Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -l`

### Solana RPC Issues

- Verify RPC URL is correct
- Check API key if using private RPC
- Try switching to public RPC for testing

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf frontend/.next`
- Clear Anchor build: `anchor clean && anchor build`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Solana](https://solana.com/) - High-performance blockchain
- [Anchor](https://www.anchor-lang.com/) - Solana framework
- [Next.js](https://nextjs.org/) - React framework
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

<div align="center">

**Built with ❤️ on Solana**

[⭐ Star this repo](https://github.com/yourusername/clearo) | [🐛 Report Bug](https://github.com/yourusername/clearo/issues) | [💡 Request Feature](https://github.com/yourusername/clearo/issues)

</div>