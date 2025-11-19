'use client';

import Link from 'next/link';
import { FileText, ArrowLeft, Download, Menu, X, Shield, Award, Zap, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { WalletAuthButtons } from '@/components/auth/WalletAuthButtons';
import { Footer } from '@/components/Footer';

export default function WhitepaperPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const downloadWhitepaper = () => {
    // Try to download PDF, fallback to print page
    const pdfUrl = '/whitepaper.pdf';
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'Clearo-Whitepaper-v1.0.pdf';
    link.target = '_blank';
    
    // Check if PDF exists, if not, open print page
    fetch(pdfUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          link.click();
        } else {
          // Fallback to print page
          window.open('/whitepaper/print', '_blank');
        }
      })
      .catch(() => {
        // Fallback to print page
        window.open('/whitepaper/print', '_blank');
      });
  };

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e5e7eb]">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between relative">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <img src="/icon.svg" alt="Clearo" className="w-8 h-8" />
              <span className="text-xl font-display tracking-tight bg-gradient-to-r from-[#2b76f0] to-[#2b76f0] bg-clip-text text-transparent">
                Clearo
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-12">
              <Link href="/projects" className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition">Projects</Link>
              <Link href="/verify" className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition">Verify</Link>
              <Link href="/whitepaper" className="text-sm font-medium text-[#1a1a1a]">Whitepaper</Link>
              <WalletAuthButtons />
            </nav>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1a1a1a] hover:opacity-80 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden absolute top-full right-0 mt-2 bg-white border border-[#e5e7eb] rounded-xl shadow-lg p-4 z-50 min-w-[200px]"
              >
                <nav className="flex flex-col gap-4">
                  <Link 
                    href="/projects" 
                    className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link 
                    href="/verify" 
                    className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Verify
                  </Link>
                  <Link 
                    href="/whitepaper" 
                    className="text-sm font-medium text-[#1a1a1a] transition py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Whitepaper
                  </Link>
                  <div className="pt-2 border-t border-[#e5e7eb] mt-2">
                    <WalletAuthButtons />
                  </div>
                </nav>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-b from-[#eff6ff] via-white to-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#eff6ff] border border-[#2b76f0]/20 rounded-full mb-8">
              <FileText className="w-4 h-4 text-[#2b76f0]" />
              <span className="text-xs font-mono text-[#2b76f0] tracking-wider font-semibold">OFFICIAL WHITEPAPER</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-display mb-6 tracking-tight text-[#0f172a]">
              Clearo Whitepaper
            </h1>
            
            <p className="text-xl md:text-2xl text-[#64748b] mb-4 font-light">
              Ownership Verified. Trust Built.
            </p>
            
            <p className="text-sm text-[#94a3b8] mb-8">
              Version 1.0 • Last Updated: October 2025
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#2b76f0] hover:bg-[#eff6ff] text-[#2b76f0] rounded-lg font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <button
                onClick={downloadWhitepaper}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2b76f0] hover:bg-[#2563eb] text-white rounded-lg font-semibold transition shadow-md shadow-[#2b76f0]/25"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Whitepaper Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-8 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            
            {/* Executive Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-16"
            >
              <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Executive Summary</h2>
              <p className="text-lg text-[#475569] leading-relaxed mb-4">
                Clearo is a decentralized transparency platform built on Solana that revolutionizes how blockchain projects establish trust and credibility. By combining on-chain ownership verification, comprehensive document management, and community-driven voting mechanisms, Clearo creates an immutable record of project transparency.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 my-8">
                <div className="bg-[#eff6ff] border border-[#2b76f0]/20 rounded-xl p-6">
                  <Shield className="w-8 h-8 text-[#2b76f0] mb-3" />
                  <h3 className="text-xl font-semibold text-[#0f172a] mb-2">On-Chain Verification</h3>
                  <p className="text-[#475569]">Projects prove ownership through cryptographically verifiable token transfers</p>
                </div>
                <div className="bg-[#eff6ff] border border-[#2b76f0]/20 rounded-xl p-6">
                  <FileText className="w-8 h-8 text-[#2b76f0] mb-3" />
                  <h3 className="text-xl font-semibold text-[#0f172a] mb-2">Transparency Profiles</h3>
                  <p className="text-[#475569]">Centralized repository for whitepapers, roadmaps, audits, and financial documents</p>
                </div>
                <div className="bg-[#eff6ff] border border-[#2b76f0]/20 rounded-xl p-6">
                  <Zap className="w-8 h-8 text-[#2b76f0] mb-3" />
                  <h3 className="text-xl font-semibold text-[#0f172a] mb-2">Token-Gated Voting</h3>
                  <p className="text-[#475569]">Community-driven evaluation with spam-resistant voting (10 CLRO tokens = 1 vote)</p>
                </div>
                <div className="bg-[#eff6ff] border border-[#2b76f0]/20 rounded-xl p-6">
                  <Award className="w-8 h-8 text-[#2b76f0] mb-3" />
                  <h3 className="text-xl font-semibold text-[#0f172a] mb-2">Automated Scoring</h3>
                  <p className="text-[#475569]">Multi-factor algorithm generating objective transparency scores</p>
                </div>
              </div>
            </motion.div>

            {/* Problem Statement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-16"
            >
              <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Problem Statement</h2>
              
              <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">The Trust Crisis in Web3</h3>
              
              <div className="space-y-4 text-[#475569] leading-relaxed">
                <div>
                  <h4 className="text-xl font-semibold text-[#0f172a] mb-2">1. Ownership Verification Challenges</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>No standardized method to verify project ownership</li>
                    <li>Easy to create fake social media accounts and websites</li>
                    <li>Investors cannot reliably confirm who controls a project</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-[#0f172a] mb-2">2. Information Asymmetry</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Project documentation scattered across multiple platforms</li>
                    <li>No single source of truth for project information</li>
                    <li>Difficult to track project updates and progress</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-[#0f172a] mb-2">3. Lack of Accountability</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Projects can make unverified claims without consequences</li>
                    <li>No mechanism to hold projects accountable for promises</li>
                    <li>Community has limited tools to evaluate project legitimacy</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Solution Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-16"
            >
              <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Solution Overview</h2>
              
              <div className="space-y-8">
                <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-8">
                  <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 flex items-center gap-3">
                    <Lock className="w-6 h-6 text-[#2b76f0]" />
                    1. Ownership Verification System
                  </h3>
                  <p className="text-[#475569] leading-relaxed mb-4">
                    Projects prove ownership through on-chain token burns. The verification process generates a unique, cryptographically secure verification code, requires burning 500 CLRO tokens with the code in the transaction memo, and verifies the transaction on-chain, creating an immutable proof of ownership.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                    <p className="text-sm font-semibold text-[#0f172a] mb-2">Benefits:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-[#475569]">
                      <li>Cryptographically verifiable proof of ownership</li>
                      <li>Cannot be faked or manipulated</li>
                      <li>Permanent on-chain record</li>
                      <li>Economic commitment (500 CLRO tokens)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-8">
                  <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-[#2b76f0]" />
                    2. Transparency Profiles
                  </h3>
                  <p className="text-[#475569] leading-relaxed mb-4">
                    Each verified project receives a comprehensive profile where they can upload and manage all transparency documents, organize documents by type, track document versions and updates, and display project statistics and metrics.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                    <p className="text-sm font-semibold text-[#0f172a] mb-2">Document Types Supported:</p>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-[#475569]">
                      <div>• Whitepapers</div>
                      <div>• Roadmaps</div>
                      <div>• Tokenomics</div>
                      <div>• Audit Reports</div>
                      <div>• Financial Transparency</div>
                      <div>• Monthly Reports</div>
                      <div>• Team Introductions</div>
                      <div>• GitHub Links</div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-8">
                  <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-[#2b76f0]" />
                    3. Token-Gated Voting System
                  </h3>
                  <p className="text-[#475569] leading-relaxed mb-4">
                    Community members vote on project transparency using CLRO tokens. Each vote requires burning 10 CLRO tokens, creating an economic cost that prevents spam and ensures only committed community members vote.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                    <p className="text-sm font-semibold text-[#0f172a] mb-2">Why Token Burning?</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-[#475569]">
                      <li>Creates economic cost for voting, preventing spam</li>
                      <li>Ensures only committed community members vote</li>
                      <li>Aligns voter incentives with project success</li>
                      <li>Prevents vote manipulation through bot networks</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-8">
                  <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 flex items-center gap-3">
                    <Award className="w-6 h-6 text-[#2b76f0]" />
                    4. Transparency Scoring Algorithm
                  </h3>
                  <p className="text-[#475569] leading-relaxed mb-4">
                    Automated scoring system calculating transparency scores from multiple factors with weighted components.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                    <p className="text-sm font-semibold text-[#0f172a] mb-3">Score Components:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[#475569]">User Votes</span>
                        <span className="font-semibold text-[#0f172a]">25%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#475569]">Documentation Quality</span>
                        <span className="font-semibold text-[#0f172a]">50%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#475569]">Project Updates</span>
                        <span className="font-semibold text-[#0f172a]">15%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#475569]">On-Chain Activity</span>
                        <span className="font-semibold text-[#0f172a]">10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Technical Architecture */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-16"
            >
              <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Technical Architecture</h2>
              
              <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">Blockchain Layer: Solana</h3>
              <p className="text-[#475569] leading-relaxed mb-6">
                Clearo is built on Solana, chosen for its high throughput (65,000+ TPS), low fees (fractional cents), fast finality (sub-second confirmation), and ecosystem maturity.
              </p>

              <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">Smart Contract Programs</h3>
              <div className="space-y-6">
                <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-[#0f172a] mb-3">1. Verification Program</h4>
                  <p className="text-[#475569] mb-3">Handles project ownership verification</p>
                  <p className="text-sm font-semibold text-[#0f172a] mb-2">Key Functions:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#475569] ml-4">
                    <li><code className="bg-[#eff6ff] px-2 py-1 rounded">initialize_verification</code>: Generate unique verification code</li>
                    <li><code className="bg-[#eff6ff] px-2 py-1 rounded">verify_ownership</code>: Verify token burn with memo</li>
                  </ul>
                </div>

                <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-[#0f172a] mb-3">2. Registry Program</h4>
                  <p className="text-[#475569] mb-3">Stores project metadata and document information</p>
                  <p className="text-sm font-semibold text-[#0f172a] mb-2">Key Functions:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#475569] ml-4">
                    <li><code className="bg-[#eff6ff] px-2 py-1 rounded">register_project</code>: Create new project entry</li>
                    <li><code className="bg-[#eff6ff] px-2 py-1 rounded">add_document</code>: Add document hash to project</li>
                    <li><code className="bg-[#eff6ff] px-2 py-1 rounded">update_score</code>: Update transparency score</li>
                  </ul>
                </div>

                <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-[#0f172a] mb-3">3. Voting Program</h4>
                  <p className="text-[#475569] mb-3">Token-gated voting system</p>
                  <p className="text-sm font-semibold text-[#0f172a] mb-2">Key Functions:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#475569] ml-4">
                    <li><code className="bg-[#eff6ff] px-2 py-1 rounded">vote</code>: Cast vote (burns 10 CLRO tokens)</li>
                    <li><code className="bg-[#eff6ff] px-2 py-1 rounded">change_vote</code>: Change existing vote</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Tokenomics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mb-16"
            >
              <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Tokenomics</h2>
              
              <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-8">
                <h3 className="text-2xl font-semibold text-[#0f172a] mb-6">CLRO Token Overview</h3>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-[#64748b] mb-1">Token Name</p>
                    <p className="text-lg font-semibold text-[#0f172a]">Clearo</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748b] mb-1">Ticker</p>
                    <p className="text-lg font-semibold text-[#0f172a]">CLRO</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748b] mb-1">Blockchain</p>
                    <p className="text-lg font-semibold text-[#0f172a]">Solana (SPL Token)</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748b] mb-1">Total Supply</p>
                    <p className="text-lg font-semibold text-[#0f172a]">TBD</p>
                  </div>
                </div>

                <h4 className="text-xl font-semibold text-[#0f172a] mb-4 mt-8">Token Utility</h4>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                    <h5 className="font-semibold text-[#0f172a] mb-2">1. Verification Fees</h5>
                    <p className="text-sm text-[#475569]">Projects burn 500 CLRO tokens to verify ownership</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                    <h5 className="font-semibold text-[#0f172a] mb-2">2. Voting Mechanism</h5>
                    <p className="text-sm text-[#475569]">Each vote requires burning 10 CLRO tokens to prevent spam</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                    <h5 className="font-semibold text-[#0f172a] mb-2">3. Governance (Future)</h5>
                    <p className="text-sm text-[#475569]">Token holders vote on platform improvements</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                    <h5 className="font-semibold text-[#0f172a] mb-2">4. Staking Rewards (Future)</h5>
                    <p className="text-sm text-[#475569]">Stake CLRO tokens to earn platform fee revenue</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Roadmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Roadmap</h2>
              
              <div className="space-y-8">
                <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Phase 1: Foundation (Q4 2025) ✅</h3>
                  <ul className="list-disc list-inside space-y-2 text-[#475569]">
                    <li>Core smart contract development</li>
                    <li>Backend API development</li>
                    <li>Frontend application</li>
                    <li>Basic transparency scoring</li>
                    <li>Initial project verification system</li>
                  </ul>
                </div>

                <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Phase 2: Enhancement (Q1 2026)</h3>
                  <ul className="list-disc list-inside space-y-2 text-[#475569]">
                    <li>IPFS integration for document storage</li>
                    <li>Enhanced scoring algorithm refinements</li>
                    <li>Mobile application (iOS/Android)</li>
                    <li>Advanced analytics dashboard</li>
                    <li>API documentation and developer tools</li>
                  </ul>
                </div>

                <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Phase 3: Expansion (Q2 2026)</h3>
                  <ul className="list-disc list-inside space-y-2 text-[#475569]">
                    <li>Multi-chain support (Ethereum, Polygon, etc.)</li>
                    <li>GitHub integration for code transparency</li>
                    <li>Treasury wallet monitoring</li>
                    <li>Automated compliance checking</li>
                    <li>Integration with major exchanges</li>
                  </ul>
                </div>

                <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Phase 4: Governance (Q3 2026)</h3>
                  <ul className="list-disc list-inside space-y-2 text-[#475569]">
                    <li>CLRO token launch and distribution</li>
                    <li>Decentralized governance system</li>
                    <li>Staking and rewards mechanism</li>
                    <li>Community treasury management</li>
                    <li>Platform upgrade proposals</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Conclusion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mb-16"
            >
              <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Conclusion</h2>
              
              <p className="text-lg text-[#475569] leading-relaxed mb-6">
                Clearo represents a paradigm shift in how blockchain projects establish and maintain trust. By combining cryptographic verification, comprehensive documentation, community validation, and automated scoring, Clearo creates a new standard for transparency in the Web3 ecosystem.
              </p>

              <div className="bg-[#eff6ff] border border-[#2b76f0]/20 rounded-xl p-8">
                <h3 className="text-2xl font-semibold text-[#0f172a] mb-4">Vision</h3>
                <p className="text-[#475569] leading-relaxed">
                  Clearo aims to become the gold standard for project transparency in Web3, where every project is verified, every claim is documented, and every vote matters. Together, we build a more transparent, trustworthy, and sustainable blockchain ecosystem.
                </p>
              </div>
            </motion.div>

            {/* Contact & Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="mb-16"
            >
              <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Contact & Resources</h2>
              <ul className="list-disc list-inside space-y-2 text-[#475569]">
                <li><strong>Website:</strong> <a href="https://clearo.dev" target="_blank" rel="noopener noreferrer" className="text-[#2b76f0] hover:underline">clearo.dev</a></li>
                <li><strong>X:</strong> <a href="https://x.com/useClearo" target="_blank" rel="noopener noreferrer" className="text-[#2b76f0] hover:underline">@useClearo</a></li>
                <li><strong>Mail:</strong> <a href="mailto:hi@clearo.dev" className="text-[#2b76f0] hover:underline">hi@clearo.dev</a></li>
              </ul>
            </motion.div>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mb-16 bg-[#fef2f2] border border-[#fecaca] rounded-xl p-6"
            >
              <p className="text-sm text-[#991b1b] leading-relaxed">
                <strong>Disclaimer:</strong> This whitepaper is for informational purposes only and does not constitute financial advice. Cryptocurrency investments carry significant risk. Please conduct your own research and consult with financial advisors before making investment decisions.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

