'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, Loader2, Wallet, Menu, X, AlertCircle, Plus, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token';
import { API_URL } from '@/src/config/api';
import { WalletAuthButtons } from '@/components/auth/WalletAuthButtons';
import { Footer } from '@/components/Footer';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

// Use environment variable for RPC URL, fallback to public mainnet
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
const VERIFICATION_ADDRESS = process.env.NEXT_PUBLIC_VERIFICATION_ADDRESS || '11111111111111111111111111111111'; // Placeholder

// CLRO token mint address - should be set via environment variable
const CLRO_TOKEN_MINT = process.env.NEXT_PUBLIC_CLRO_TOKEN_MINT || '11111111111111111111111111111111'; // Placeholder - update with actual mint address
const VERIFICATION_BURN_AMOUNT = 500_000_000; // 500 CLRO tokens (assuming 6 decimals)

interface Project {
  project_id: string;
  name: string;
  description: string;
  logo_url?: string;
  contract_address?: string;
  twitter_url?: string;
  website_url?: string;
  github_url?: string;
  verified: boolean;
  verified_by_wallet?: string;
  transparency_score: number;
  owner_wallet: string;
  created_at: string;
}

export default function VerifyPage() {
  const { publicKey, sendTransaction, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [step, setStep] = useState<'list' | 'form' | 'verification' | 'success'>('list');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    project_id: '',
    name: '',
    description: '',
    contract_address: '',
    twitter_url: '',
    website_url: '',
    github_url: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionSignature, setTransactionSignature] = useState('');

  // Fetch user's projects when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProjects();
    } else {
      setProjects([]);
    }
  }, [connected, publicKey]);

  const fetchUserProjects = async () => {
    if (!publicKey) return;
    
    setLoadingProjects(true);
    try {
      const response = await axios.get(`${API_URL}/api/projects`, {
        params: {
          owner_wallet: publicKey.toString(),
        },
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({ project_id: '', name: '', description: '', contract_address: '', twitter_url: '', website_url: '', github_url: '' });
    setSelectedProject(null);
    setStep('form');
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      project_id: project.project_id,
      name: project.name,
      description: project.description,
      contract_address: project.contract_address || '',
      twitter_url: project.twitter_url || '',
      website_url: project.website_url || '',
      github_url: project.github_url || '',
    });
    
    if (project.verified) {
      setError('This project is already verified');
    } else {
      // Generate verification code for existing project
      const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setVerificationCode(code);
      setStep('verification');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Register project with connected wallet
      await axios.post(`${API_URL}/api/projects`, {
        project_id: formData.project_id,
        owner_wallet: publicKey.toString(),
        name: formData.name,
        description: formData.description,
        contract_address: formData.contract_address || null,
        twitter_url: formData.twitter_url || null,
        website_url: formData.website_url || null,
        github_url: formData.github_url || null,
      });

      // Generate verification code (in production, this would come from on-chain)
      const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setVerificationCode(code);
      setSelectedProject(null);
      setStep('verification');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to register project');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    const projectId = selectedProject?.project_id || formData.project_id;
    if (!projectId) {
      setError('No project selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      
      // Get CLRO token mint address
      const clroMint = new PublicKey(CLRO_TOKEN_MINT);
      
      // Get or create associated token account for the user
      const userTokenAccount = await getAssociatedTokenAddress(
        clroMint,
        publicKey,
        false, // allowOwnerOffCurve
        TOKEN_PROGRAM_ID
      );
      
      // Check if token account exists and has sufficient balance
      try {
        const tokenAccountInfo = await getAccount(connection, userTokenAccount);
        if (tokenAccountInfo.amount < BigInt(VERIFICATION_BURN_AMOUNT)) {
          setError(`Insufficient CLRO tokens. You need at least 500 CLRO tokens to verify.`);
          setLoading(false);
          return;
        }
      } catch (error: any) {
        // Token account doesn't exist or has no balance
        setError(`You don't have any CLRO tokens. Please acquire at least 500 CLRO tokens to verify.`);
          setLoading(false);
          return;
      }
      
      // Create burn instruction to burn CLRO tokens
      const burnInstruction = createBurnInstruction(
        userTokenAccount, // token account to burn from
        clroMint, // mint address
        publicKey, // owner/authority
        VERIFICATION_BURN_AMOUNT, // amount to burn (in smallest unit, 6 decimals)
        [], // multiSigners (empty for single signer)
        TOKEN_PROGRAM_ID
      );
      
      // Add memo instruction with verification code for additional verification
      const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
      const memoInstruction = new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(verificationCode, 'utf-8'),
      });
      
      // Create transaction with burn and memo instructions
      const transaction = new Transaction()
        .add(burnInstruction)
        .add(memoInstruction);

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      setTransactionSignature(signature);

      // Verify project with transaction signature
      await axios.patch(
        `${API_URL}/api/projects/${projectId}/verify`,
        { 
          verified: true,
          transactionSignature: signature,
          verificationCode: verificationCode,
          verifying_wallet: publicKey.toString() // Store wallet that verified for transparency
        }
      );

      // Refresh projects list
      await fetchUserProjects();
      setStep('success');
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to verify project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
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
                <Link href="/verify" className="text-sm font-medium text-[#1a1a1a]">Verify</Link>
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
                      className="text-sm font-medium text-[#1a1a1a] transition py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Verify
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

      <main className="container mx-auto px-8 py-20 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-[#64748b] hover:text-[#1a1a1a] mb-12 transition text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Wallet Connection Status */}
        <div className="mb-8 p-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg">
          {connected && publicKey ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#eff6ff] border border-[#2b76f0]/30 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#2b76f0]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0f172a]">Wallet Connected</div>
                  <div className="text-xs text-[#64748b] font-mono">{publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</div>
                </div>
              </div>
              <button
                onClick={() => disconnect()}
                className="text-sm text-[#64748b] hover:text-[#1a1a1a] transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fef2f2] border border-red-200 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0f172a]">Wallet Not Connected</div>
                  <div className="text-xs text-[#64748b]">Connect your Solana wallet to view and verify your projects</div>
                </div>
              </div>
              <WalletMultiButton className="!bg-[#2b76f0] hover:!bg-[#2563eb] !text-white !rounded-lg !px-4 !py-2 !text-sm !font-semibold !shadow-sm hover:!shadow-md !transition" />
            </div>
          )}
        </div>

        {/* Projects List View */}
        {step === 'list' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-display mb-4 tracking-tight text-[#0f172a]">My Projects</h1>
                <p className="text-[#64748b] text-lg">Manage and verify your projects</p>
              </div>
              {connected && (
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3 bg-[#2b76f0] hover:bg-[#2563eb] text-white rounded-lg font-semibold transition flex items-center gap-2 shadow-md shadow-[#2b76f0]/25 hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  New Project
                </button>
              )}
            </div>

            {!connected ? (
              <div className="text-center py-20 bg-[#f8fafc] border border-[#e5e7eb] rounded-2xl">
                <Wallet className="w-16 h-16 text-[#94a3b8] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#0f172a] mb-2">Connect Your Wallet</h3>
                <p className="text-[#64748b] mb-6">Connect your Solana wallet to view and verify your projects</p>
                <WalletMultiButton className="!bg-[#2b76f0] hover:!bg-[#2563eb] !text-white !rounded-lg !px-6 !py-3 !font-semibold !shadow-sm hover:!shadow-md !transition" />
              </div>
            ) : loadingProjects ? (
              <div className="text-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#2b76f0] mx-auto" />
                <p className="text-[#64748b] mt-4">Loading your projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20 bg-[#f8fafc] border border-[#e5e7eb] rounded-2xl">
                <FileText className="w-16 h-16 text-[#94a3b8] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#0f172a] mb-2">No Projects Yet</h3>
                <p className="text-[#64748b] mb-6">Create your first project to get started</p>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3 bg-[#2b76f0] hover:bg-[#2563eb] text-white rounded-lg font-semibold transition"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <motion.div
                    key={project.project_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-[#e5e7eb] rounded-xl p-6 hover:border-[#2b76f0]/40 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-[#0f172a]">{project.name}</h3>
                          {project.verified ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg font-semibold">
                              <CheckCircle2 className="w-4 h-4" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg font-semibold">
                              <AlertCircle className="w-4 h-4" />
                              Not Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[#64748b] mb-4">{project.description}</p>
                        <div className="flex items-center gap-4 text-sm text-[#94a3b8]">
                          <span>ID: {project.project_id}</span>
                          <span>•</span>
                          <span>Score: {project.transparency_score}/100</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {!project.verified && (
                          <button
                            onClick={() => handleSelectProject(project)}
                            className="px-4 py-2 bg-[#2b76f0] hover:bg-[#2563eb] text-white rounded-lg font-semibold transition text-sm"
                          >
                            Verify
                          </button>
                        )}
                        <Link
                          href={`/projects/${project.project_id}`}
                          className="px-4 py-2 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e5e7eb] text-[#64748b] rounded-lg font-semibold transition text-sm"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Create New Project Form */}
        {step === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setStep('list')}
                className="p-2 hover:bg-[#f8fafc] rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-[#64748b]" />
              </button>
              <div>
                <h1 className="text-5xl md:text-6xl font-display mb-2 tracking-tight text-[#0f172a]">Create Project</h1>
                <p className="text-[#64748b]">Register a new project for verification</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Project ID</label>
                <input
                  type="text"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 transition placeholder:text-[#94a3b8]"
                  placeholder="my-project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 transition placeholder:text-[#94a3b8]"
                  placeholder="My Project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 transition resize-none placeholder:text-[#94a3b8]"
                  rows={4}
                  placeholder="Project description..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Contract Address (Optional)</label>
                <input
                  type="text"
                  value={formData.contract_address}
                  onChange={(e) => setFormData({ ...formData, contract_address: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 transition placeholder:text-[#94a3b8] font-mono text-sm"
                  placeholder="Solana program/contract address (optional)"
                />
                <p className="mt-1 text-xs text-[#64748b]">The Solana program or contract address associated with this project</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Twitter/X URL (Optional)</label>
                <input
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 transition placeholder:text-[#94a3b8]"
                  placeholder="https://twitter.com/yourproject or https://x.com/yourproject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Website URL (Optional)</label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 transition placeholder:text-[#94a3b8]"
                  placeholder="https://yourproject.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">GitHub URL (Optional)</label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#e5e7eb] text-[#1a1a1a] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 transition placeholder:text-[#94a3b8]"
                  placeholder="https://github.com/yourproject"
                />
                <p className="mt-1 text-xs text-[#64748b]">Add your GitHub repository URL (5 points)</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('list')}
                  className="flex-1 px-6 py-4 bg-[#f8fafc] border border-[#e5e7eb] text-[#64748b] rounded-lg font-semibold transition hover:bg-[#f1f5f9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !connected}
                  className="flex-1 px-6 py-4 bg-[#2b76f0] hover:bg-[#2563eb] disabled:bg-[#e5e7eb] disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-[#2b76f0]/25 hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Project'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Verification Step */}
        {step === 'verification' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => {
                  setStep('list');
                  setError('');
                  setTransactionSignature('');
                }}
                className="p-2 hover:bg-[#f8fafc] rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-[#64748b]" />
              </button>
              <div>
                <h2 className="text-4xl font-display mb-2 tracking-tight text-[#0f172a]">Verify Project</h2>
                {selectedProject && (
                  <p className="text-[#64748b]">{selectedProject.name}</p>
                )}
              </div>
            </div>

            <p className="text-[#64748b] mb-8">
              To verify your project ownership, you need to burn 500 CLRO tokens with the verification code in the transaction memo.
              Burning tokens proves ownership and adds economic commitment to your project.
            </p>
            
            <div className="bg-[#eff6ff] border border-[#2b76f0]/30 rounded-lg p-6 mb-8">
              <div className="text-sm text-[#64748b] mb-2">Verification Code:</div>
              <code className="text-[#2b76f0] font-mono text-lg break-all">
                {verificationCode}
              </code>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {transactionSignature && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                <div className="font-semibold mb-1">Transaction sent!</div>
                <div className="text-xs font-mono break-all">{transactionSignature}</div>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || !connected}
              className="w-full px-6 py-4 bg-[#2b76f0] hover:bg-[#2563eb] disabled:bg-[#e5e7eb] text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-[#2b76f0]/25 hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Complete Verification'
              )}
            </button>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-[#eff6ff] border-2 border-[#2b76f0]/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-12 h-12 text-[#2b76f0]" />
            </div>
            <h2 className="text-4xl font-display mb-4 tracking-tight text-[#0f172a]">Verified!</h2>
            <p className="text-[#64748b] mb-12 text-lg">
              Your project is now verified. Upload documents and build your transparency profile.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setStep('list');
                  setError('');
                  setTransactionSignature('');
                }}
                className="px-6 py-3 bg-[#f8fafc] border border-[#e5e7eb] text-[#64748b] rounded-lg font-semibold transition hover:bg-[#f1f5f9]"
              >
                Back to Projects
              </button>
              <Link
                href={`/projects/${selectedProject?.project_id || formData.project_id}`}
                className="px-6 py-3 bg-[#2b76f0] hover:bg-[#2563eb] text-white rounded-lg font-semibold transition shadow-md shadow-[#2b76f0]/25 hover:shadow-lg"
              >
                View Project
              </Link>
            </div>
          </motion.div>
        )}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
