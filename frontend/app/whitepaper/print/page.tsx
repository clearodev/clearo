'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

export default function WhitepaperPrintPage() {
  useEffect(() => {
    // Add comprehensive print styles
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          margin: 2cm;
          size: A4;
        }
        
        .no-print {
          display: none !important;
        }
        
        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.8;
          color: #1a1a1a;
          font-size: 11pt;
          background: white;
        }
        
        h1 {
          color: #2b76f0;
          border-bottom: 3px solid #2b76f0;
          padding-bottom: 15px;
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 2.5em;
          page-break-after: avoid;
        }
        
        h2 {
          color: #0f172a;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          margin-top: 30px;
          margin-bottom: 15px;
          font-size: 2em;
          page-break-after: avoid;
        }
        
        h3 {
          color: #1e293b;
          margin-top: 25px;
          margin-bottom: 12px;
          font-size: 1.5em;
          page-break-after: avoid;
        }
        
        h4 {
          color: #334155;
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 1.2em;
        }
        
        p {
          margin-bottom: 12px;
          text-align: justify;
        }
        
        ul, ol {
          margin-bottom: 15px;
          padding-left: 30px;
        }
        
        li {
          margin-bottom: 8px;
        }
        
        code {
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        
        pre {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          padding: 15px;
          border-radius: 6px;
          overflow-x: auto;
          page-break-inside: avoid;
          margin: 15px 0;
        }
        
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 25px 0;
          page-break-inside: avoid;
        }
        
        th, td {
          border: 1px solid #e5e7eb;
          padding: 12px;
          text-align: left;
        }
        
        th {
          background: #eff6ff;
          color: #0f172a;
          font-weight: bold;
        }
        
        strong {
          color: #0f172a;
          font-weight: 600;
        }
        
        hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 30px 0;
        }
        
        .bg-\\[#f8fafc\\], .bg-\\[#eff6ff\\], .bg-\\[#f0fdf4\\] {
          background: white !important;
          border: 1px solid #e5e7eb !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-[#e5e7eb] shadow-sm">
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/whitepaper"
              className="inline-flex items-center gap-2 px-4 py-2 text-[#64748b] hover:text-[#1a1a1a] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Whitepaper
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2b76f0] hover:bg-[#2563eb] text-white rounded-lg font-semibold transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Full Whitepaper Content - Print Optimized */}
      <div className="container mx-auto px-8 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-display mb-4 text-[#2b76f0]">Clearo Whitepaper</h1>
            <p className="text-2xl text-[#64748b] mb-4 font-light">Ownership Verified. Trust Built.</p>
            <p className="text-sm text-[#94a3b8]">Version 1.0 • Last Updated: October 2025</p>
          </div>

          <hr className="my-12" />

          {/* Table of Contents */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-[#475569]">
              <li>Executive Summary</li>
              <li>Introduction</li>
              <li>Problem Statement</li>
              <li>Solution Overview</li>
              <li>Technical Architecture</li>
              <li>Transparency Scoring System</li>
              <li>Tokenomics</li>
              <li>Use Cases</li>
              <li>Security & Trust</li>
              <li>Roadmap</li>
              <li>Conclusion</li>
            </ol>
          </section>

          <hr className="my-12" />

          {/* Executive Summary */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Executive Summary</h2>
            <p className="text-lg text-[#475569] leading-relaxed mb-4">
              Clearo is a decentralized transparency platform built on Solana that revolutionizes how blockchain projects establish trust and credibility. By combining on-chain ownership verification, comprehensive document management, and community-driven voting mechanisms, Clearo creates an immutable record of project transparency.
            </p>
            
            <div className="my-6">
              <p className="font-semibold text-[#0f172a] mb-3">Key Innovations:</p>
              <ul className="list-disc list-inside space-y-2 text-[#475569]">
                <li><strong>On-Chain Ownership Verification</strong>: Projects prove ownership through cryptographically verifiable token burns</li>
                <li><strong>Comprehensive Transparency Profiles</strong>: Centralized repository for whitepapers, roadmaps, audits, and financial documents</li>
                <li><strong>Token-Gated Voting System</strong>: Community-driven evaluation with spam-resistant voting (10 CLRO tokens = 1 vote)</li>
                <li><strong>Automated Transparency Scoring</strong>: Multi-factor algorithm generating objective transparency scores</li>
              </ul>
            </div>

            <p className="text-lg text-[#475569] leading-relaxed">
              Clearo addresses the critical trust deficit in the Web3 ecosystem by providing a standardized, verifiable, and community-validated transparency framework.
            </p>
          </section>

          <hr className="my-12" />

          {/* Introduction */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Introduction</h2>
            <p className="text-lg text-[#475569] leading-relaxed mb-4">
              The blockchain and cryptocurrency ecosystem has experienced explosive growth, with thousands of projects launching annually. However, this rapid expansion has been accompanied by significant challenges:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#475569] mb-4">
              <li><strong>Lack of Standardization</strong>: No unified system for verifying project legitimacy</li>
              <li><strong>Information Fragmentation</strong>: Critical project information scattered across multiple platforms</li>
              <li><strong>Trust Deficit</strong>: Investors struggle to distinguish legitimate projects from scams</li>
              <li><strong>Limited Accountability</strong>: Projects can make unverified claims without consequences</li>
            </ul>
            <p className="text-lg text-[#475569] leading-relaxed">
              Clearo emerges as the solution to these systemic issues, providing a comprehensive platform where transparency is not just encouraged—it's verified, scored, and rewarded.
            </p>
          </section>

          <hr className="my-12" />

          {/* Problem Statement */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Problem Statement</h2>
            
            <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">The Trust Crisis in Web3</h3>
            
            <div className="space-y-6 text-[#475569] leading-relaxed">
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
                  <li>Project documentation scattered across websites, GitHub, Discord, and Twitter</li>
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
              
              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-2">4. Spam and Manipulation</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Voting systems vulnerable to bot attacks</li>
                  <li>Fake reviews and ratings easily generated</li>
                  <li>No cost mechanism to prevent manipulation</li>
                </ul>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">Market Impact</h3>
            <p className="text-lg text-[#475569] leading-relaxed mb-4">
              These problems have real consequences:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#475569]">
              <li><strong>Investor Losses</strong>: Billions lost to scams and rug pulls</li>
              <li><strong>Market Inefficiency</strong>: Legitimate projects struggle to gain trust</li>
              <li><strong>Ecosystem Fragmentation</strong>: Lack of standardized trust metrics</li>
              <li><strong>Regulatory Uncertainty</strong>: Difficulty in establishing compliance frameworks</li>
            </ul>
          </section>

          <hr className="my-12" />

          {/* Solution Overview */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Solution Overview</h2>
            <p className="text-lg text-[#475569] leading-relaxed mb-6">
              Clearo provides a comprehensive transparency platform that addresses all aspects of project verification and trust-building.
            </p>
            
            <h3 className="text-2xl font-semibold text-[#0f172a] mb-4">Core Components</h3>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-3">1. Ownership Verification System</h4>
                <p className="text-[#475569] leading-relaxed mb-3">
                  Projects prove ownership through on-chain token burns. The verification process generates a unique, cryptographically secure verification code, requires burning 500 CLRO tokens with the code in the transaction memo, and verifies the transaction on-chain, creating an immutable proof of ownership.
                </p>
                <p className="font-semibold text-[#0f172a] mb-2">Benefits:</p>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li>Cryptographically verifiable proof of ownership</li>
                  <li>Cannot be faked or manipulated</li>
                  <li>Permanent on-chain record</li>
                  <li>Economic commitment (500 CLRO tokens)</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-3">2. Transparency Profiles</h4>
                <p className="text-[#475569] leading-relaxed mb-3">
                  Each verified project receives a comprehensive profile where they can upload and manage all transparency documents, organize documents by type, track document versions and updates, and display project statistics and metrics.
                </p>
                <p className="font-semibold text-[#0f172a] mb-2">Document Types Supported:</p>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li>Whitepapers</li>
                  <li>Roadmaps</li>
                  <li>Tokenomics</li>
                  <li>Audit Reports</li>
                  <li>Financial Transparency Reports</li>
                  <li>Monthly/Quarterly Updates</li>
                  <li>Team Introductions</li>
                  <li>GitHub Repository Links</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-3">3. Token-Gated Voting System</h4>
                <p className="text-[#475569] leading-relaxed mb-3">
                  Community members vote on project transparency using CLRO tokens. Each vote requires burning 10 CLRO tokens, creating an economic cost that prevents spam and ensures only committed community members vote.
                </p>
                <p className="font-semibold text-[#0f172a] mb-2">Why Token Burning?</p>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li>Creates economic cost for voting, preventing spam</li>
                  <li>Ensures only committed community members vote</li>
                  <li>Aligns voter incentives with project success</li>
                  <li>Prevents vote manipulation through bot networks</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-3">4. Transparency Scoring Algorithm</h4>
                <p className="text-[#475569] leading-relaxed mb-3">
                  Automated scoring system calculating transparency scores from multiple factors with weighted components.
                </p>
                <p className="font-semibold text-[#0f172a] mb-2">Score Components:</p>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li><strong>User Votes (25%)</strong>: Community sentiment based on upvote/downvote ratio</li>
                  <li><strong>Documentation Quality (50%)</strong>: Completeness and types of documents uploaded</li>
                  <li><strong>Project Updates (15%)</strong>: Recent activity and engagement</li>
                  <li><strong>On-Chain Activity (10%)</strong>: Verification status and blockchain activity</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="my-12" />

          {/* Technical Architecture */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Technical Architecture</h2>
            
            <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">Blockchain Layer: Solana</h3>
            <p className="text-[#475569] leading-relaxed mb-6">
              Clearo is built on Solana, chosen for its high throughput (65,000+ TPS), low fees (fractional cents), fast finality (sub-second confirmation), and ecosystem maturity.
            </p>

            <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">Smart Contract Programs</h3>
            <p className="text-[#475569] leading-relaxed mb-4">
              Clearo consists of three core Solana programs (smart contracts):
            </p>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-3">1. Verification Program</h4>
                <p className="text-[#475569] mb-2"><strong>Purpose:</strong> Handle project ownership verification</p>
                <p className="text-sm font-semibold text-[#0f172a] mb-2">Key Functions:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-[#475569] ml-4">
                  <li><code className="bg-[#eff6ff] px-2 py-1 rounded">initialize_verification</code>: Generate unique verification code</li>
                  <li><code className="bg-[#eff6ff] px-2 py-1 rounded">verify_ownership</code>: Verify token burn with memo</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-3">2. Registry Program</h4>
                <p className="text-[#475569] mb-2"><strong>Purpose:</strong> Store project metadata and document information</p>
                <p className="text-sm font-semibold text-[#0f172a] mb-2">Key Functions:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-[#475569] ml-4">
                  <li><code className="bg-[#eff6ff] px-2 py-1 rounded">register_project</code>: Create new project entry</li>
                  <li><code className="bg-[#eff6ff] px-2 py-1 rounded">add_document</code>: Add document hash to project</li>
                  <li><code className="bg-[#eff6ff] px-2 py-1 rounded">update_score</code>: Update transparency score</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-3">3. Voting Program</h4>
                <p className="text-[#475569] mb-2"><strong>Purpose:</strong> Token-gated voting system</p>
                <p className="text-sm font-semibold text-[#0f172a] mb-2">Key Functions:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-[#475569] ml-4">
                  <li><code className="bg-[#eff6ff] px-2 py-1 rounded">vote</code>: Cast vote (burns 10 CLRO tokens)</li>
                  <li><code className="bg-[#eff6ff] px-2 py-1 rounded">change_vote</code>: Change existing vote</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="my-12" />

          {/* Transparency Scoring System */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Transparency Scoring System</h2>
            
            <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">Algorithm Overview</h3>
            <p className="text-[#475569] leading-relaxed mb-4">
              The transparency score is calculated using a weighted multi-factor algorithm:
            </p>
            <pre className="bg-[#f8fafc] border border-[#e5e7eb] p-4 rounded"><code>Total Score = Vote Score + Doc Score + Update Score + OnChain Score</code></pre>
            
            <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">Component Details</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-2">1. User Votes (25% of total score)</h4>
                <p className="text-[#475569] mb-2"><strong>Calculation:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li>Upvote ratio = Upvotes / (Upvotes + Downvotes)</li>
                  <li>Vote Score = Upvote Ratio × 25</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-2">2. Documentation Quality (50% of total score)</h4>
                <p className="text-[#475569] mb-2"><strong>Document Types and Weights:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li>Whitepaper: 10 points</li>
                  <li>Audit Report: 10 points</li>
                  <li>Tokenomics: 8 points</li>
                  <li>Roadmap: 8 points</li>
                  <li>Financial Transparency: 8 points</li>
                  <li>Monthly Report: 6 points</li>
                  <li>Team Introduction: 5 points</li>
                  <li>GitHub Link: 5 points</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-2">3. Project Updates (15% of total score)</h4>
                <p className="text-[#475569] mb-2"><strong>Calculation:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li>Count updates in last 30 days</li>
                  <li>Update Score = min(Update Count × 2, 15)</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-2">4. On-Chain Activity (10% of total score)</h4>
                <p className="text-[#475569] mb-2"><strong>Components:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li>Verification Status: 5 points (if verified)</li>
                  <li>Recent Verification: 5 points (if verified within 30 days)</li>
                </ul>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">Badge System</h3>
            <table className="w-full border-collapse border border-[#e5e7eb]">
              <thead>
                <tr className="bg-[#eff6ff]">
                  <th className="border border-[#e5e7eb] p-3 text-left">Badge</th>
                  <th className="border border-[#e5e7eb] p-3 text-left">Score Range</th>
                  <th className="border border-[#e5e7eb] p-3 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#e5e7eb] p-3">💎 Diamond</td>
                  <td className="border border-[#e5e7eb] p-3">90-100</td>
                  <td className="border border-[#e5e7eb] p-3">Exceptional transparency, comprehensive documentation, strong community trust</td>
                </tr>
                <tr>
                  <td className="border border-[#e5e7eb] p-3">⭐ Platinum</td>
                  <td className="border border-[#e5e7eb] p-3">75-89</td>
                  <td className="border border-[#e5e7eb] p-3">High transparency standards, good documentation, positive community sentiment</td>
                </tr>
                <tr>
                  <td className="border border-[#e5e7eb] p-3">🥇 Gold</td>
                  <td className="border border-[#e5e7eb] p-3">60-74</td>
                  <td className="border border-[#e5e7eb] p-3">Good transparency practices, adequate documentation, generally trusted</td>
                </tr>
                <tr>
                  <td className="border border-[#e5e7eb] p-3">🥈 Silver</td>
                  <td className="border border-[#e5e7eb] p-3">45-59</td>
                  <td className="border border-[#e5e7eb] p-3">Basic transparency requirements met, minimal documentation</td>
                </tr>
                <tr>
                  <td className="border border-[#e5e7eb] p-3">🥉 Bronze</td>
                  <td className="border border-[#e5e7eb] p-3">30-44</td>
                  <td className="border border-[#e5e7eb] p-3">Minimal transparency, limited documentation</td>
                </tr>
                <tr>
                  <td className="border border-[#e5e7eb] p-3">⚠️ Unverified</td>
                  <td className="border border-[#e5e7eb] p-3">&lt;30</td>
                  <td className="border border-[#e5e7eb] p-3">Not verified or insufficient transparency metrics</td>
                </tr>
              </tbody>
            </table>
          </section>

          <hr className="my-12" />

          {/* Tokenomics */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Tokenomics</h2>
            
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
              <div>
                <h5 className="font-semibold text-[#0f172a] mb-2">1. Verification Fees</h5>
                <p className="text-[#475569]">Projects burn 500 CLRO tokens to verify ownership</p>
              </div>
              <div>
                <h5 className="font-semibold text-[#0f172a] mb-2">2. Voting Mechanism</h5>
                <p className="text-[#475569]">Each vote requires burning 10 CLRO tokens to prevent spam</p>
              </div>
              <div>
                <h5 className="font-semibold text-[#0f172a] mb-2">3. Governance (Future)</h5>
                <p className="text-[#475569]">Token holders vote on platform improvements</p>
              </div>
              <div>
                <h5 className="font-semibold text-[#0f172a] mb-2">4. Staking Rewards (Future)</h5>
                <p className="text-[#475569]">Stake CLRO tokens to earn platform fee revenue</p>
              </div>
            </div>
          </section>

          <hr className="my-12" />

          {/* Use Cases */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Use Cases</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-[#0f172a] mb-3">1. Project Verification</h3>
                <p className="text-[#475569] mb-2"><strong>Scenario:</strong> A new DeFi project wants to establish credibility</p>
                <p className="text-[#475569] mb-2"><strong>Outcome:</strong> Project gains verified status and transparency badge, building investor confidence</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0f172a] mb-3">2. Investor Due Diligence</h3>
                <p className="text-[#475569] mb-2"><strong>Scenario:</strong> An investor evaluates multiple projects</p>
                <p className="text-[#475569] mb-2"><strong>Outcome:</strong> Investor saves time and reduces risk through standardized transparency metrics</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0f172a] mb-3">3. Community Governance</h3>
                <p className="text-[#475569] mb-2"><strong>Scenario:</strong> A DAO wants to demonstrate transparency</p>
                <p className="text-[#475569] mb-2"><strong>Outcome:</strong> DAO builds trust and attracts more participants</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0f172a] mb-3">4. Exchange Listing</h3>
                <p className="text-[#475569] mb-2"><strong>Scenario:</strong> A project applies for exchange listing</p>
                <p className="text-[#475569] mb-2"><strong>Outcome:</strong> Exchange uses standardized metrics for listing decisions</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0f172a] mb-3">5. Audit and Compliance</h3>
                <p className="text-[#475569] mb-2"><strong>Scenario:</strong> A project needs to demonstrate compliance</p>
                <p className="text-[#475569] mb-2"><strong>Outcome:</strong> Project demonstrates compliance through verifiable transparency</p>
              </div>
            </div>
          </section>

          <hr className="my-12" />

          {/* Security & Trust */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Security & Trust</h2>
            
            <h3 className="text-2xl font-semibold text-[#0f172a] mb-4 mt-8">Security Measures</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-2">1. On-Chain Verification</h4>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li><strong>Cryptographic Proof</strong>: Ownership verified through blockchain transactions</li>
                  <li><strong>Immutability</strong>: Verification records cannot be altered</li>
                  <li><strong>Transparency</strong>: All verification data publicly auditable</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-2">2. Token-Gated Voting</h4>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li><strong>Spam Prevention</strong>: Token burning prevents bot attacks</li>
                  <li><strong>Economic Cost</strong>: Voting requires real economic commitment</li>
                  <li><strong>Sybil Resistance</strong>: Cost of creating multiple identities prohibitive</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-[#0f172a] mb-2">3. Document Integrity</h4>
                <ul className="list-disc list-inside space-y-1 text-[#475569] ml-4">
                  <li><strong>Hash Verification</strong>: Document hashes stored on-chain</li>
                  <li><strong>Tamper Detection</strong>: Any document modification detectable</li>
                  <li><strong>Version Control</strong>: Document history tracked and auditable</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="my-12" />

          {/* Roadmap */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Roadmap</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Phase 1: Foundation (Q4 2025) ✅</h3>
                <ul className="list-disc list-inside space-y-2 text-[#475569]">
                  <li>Core smart contract development</li>
                  <li>Backend API development</li>
                  <li>Frontend application</li>
                  <li>Basic transparency scoring</li>
                  <li>Initial project verification system</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Phase 2: Enhancement (Q1 2026)</h3>
                <ul className="list-disc list-inside space-y-2 text-[#475569]">
                  <li>IPFS integration for document storage</li>
                  <li>Enhanced scoring algorithm refinements</li>
                  <li>Mobile application (iOS/Android)</li>
                  <li>Advanced analytics dashboard</li>
                  <li>API documentation and developer tools</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Phase 3: Expansion (Q2 2026)</h3>
                <ul className="list-disc list-inside space-y-2 text-[#475569]">
                  <li>Multi-chain support (Ethereum, Polygon, etc.)</li>
                  <li>GitHub integration for code transparency</li>
                  <li>Treasury wallet monitoring</li>
                  <li>Automated compliance checking</li>
                  <li>Integration with major exchanges</li>
                </ul>
              </div>

              <div>
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
          </section>

          <hr className="my-12" />

          {/* Conclusion */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Conclusion</h2>
            
            <p className="text-lg text-[#475569] leading-relaxed mb-6">
              Clearo represents a paradigm shift in how blockchain projects establish and maintain trust. By combining cryptographic verification, comprehensive documentation, community validation, and automated scoring, Clearo creates a new standard for transparency in the Web3 ecosystem.
            </p>

            <div className="my-6">
              <p className="font-semibold text-[#0f172a] mb-3">Key Achievements:</p>
              <ul className="list-disc list-inside space-y-2 text-[#475569]">
                <li><strong>Verifiable Ownership</strong>: Projects can prove ownership cryptographically</li>
                <li><strong>Standardized Transparency</strong>: Unified framework for project evaluation</li>
                <li><strong>Community-Driven</strong>: Trust built through community validation</li>
                <li><strong>Automated Scoring</strong>: Objective, transparent scoring system</li>
              </ul>
            </div>

            <div className="bg-[#eff6ff] border border-[#2b76f0]/20 rounded-xl p-8 mt-8">
              <h3 className="text-2xl font-semibold text-[#0f172a] mb-4">Vision</h3>
              <p className="text-[#475569] leading-relaxed">
                Clearo aims to become the gold standard for project transparency in Web3, where every project is verified, every claim is documented, and every vote matters. Together, we build a more transparent, trustworthy, and sustainable blockchain ecosystem.
              </p>
            </div>
          </section>

          <hr className="my-12" />

          {/* Contact & Resources */}
          <section className="mb-16">
            <h2 className="text-4xl font-display mb-6 text-[#0f172a] border-b border-[#e5e7eb] pb-4">Contact & Resources</h2>
            <ul className="list-disc list-inside space-y-2 text-[#475569]">
              <li><strong>Website:</strong> clearo.dev</li>
              <li><strong>X:</strong> @useClearo</li>
              <li><strong>Mail:</strong> hi@clearo.dev</li>
            </ul>
          </section>

          <hr className="my-12" />

          {/* Disclaimer */}
          <section className="mb-16 bg-[#fef2f2] border border-[#fecaca] rounded-xl p-6">
            <p className="text-sm text-[#991b1b] leading-relaxed">
              <strong>Disclaimer:</strong> This whitepaper is for informational purposes only and does not constitute financial advice. Cryptocurrency investments carry significant risk. Please conduct your own research and consult with financial advisors before making investment decisions.
            </p>
            <p className="text-sm text-[#991b1b] leading-relaxed mt-4">
              <strong>© 2025 Clearo. All rights reserved.</strong>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
