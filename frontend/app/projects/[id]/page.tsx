'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Award, TrendingUp, TrendingDown, FileText, Upload, ArrowLeft, Menu, X, Edit2, Save, XCircle, Plus, Loader2, ExternalLink, Twitter, Globe, Wallet, Github } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token';
import { API_URL } from '@/src/config/api';
import { WalletAuthButtons } from '@/components/auth/WalletAuthButtons';
import { Footer } from '@/components/Footer';

// CLRO token mint address - should match verification
const CLRO_TOKEN_MINT = process.env.NEXT_PUBLIC_CLRO_TOKEN_MINT || '11111111111111111111111111111111';
const VOTE_BURN_AMOUNT = 10_000_000; // 10 CLRO tokens (assuming 6 decimals)
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';

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
  verified_at?: string;
  transparency_score: number;
  owner_wallet: string;
}

interface Document {
  id: number;
  doc_type: string;
  url: string;
  uploaded_at: string;
}

interface VoteStats {
  upvotes: string;
  downvotes: string;
  total_votes: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { publicKey, connected, sendTransaction } = useWallet();
  const [project, setProject] = useState<Project | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<'Upvote' | 'Downvote' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', contract_address: '', twitter_url: '', website_url: '', github_url: '' });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [voting, setVoting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchProjectData();
    }
  }, [params.id]);

  // Fetch user's vote when wallet connects or project changes
  useEffect(() => {
    if (params.id && connected && publicKey) {
      fetchUserVote();
    } else {
      setUserVote(null);
    }
  }, [params.id, connected, publicKey]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, docsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/projects/${params.id}`),
        axios.get(`${API_URL}/api/documents/project/${params.id}`),
        axios.get(`${API_URL}/api/voting/project/${params.id}`),
      ]);

      setProject(projectRes.data);
      setDocuments(docsRes.data);
      setVoteStats(statsRes.data);
      setEditForm({
        name: projectRes.data.name,
        description: projectRes.data.description,
        contract_address: projectRes.data.contract_address || '',
        twitter_url: projectRes.data.twitter_url || '',
        website_url: projectRes.data.website_url || '',
        github_url: projectRes.data.github_url || '',
      });
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVote = async () => {
    if (!publicKey || !params.id) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/voting/project/${params.id}/user/${publicKey.toString()}`);
      if (response.data && response.data.vote_type) {
        setUserVote(response.data.vote_type);
      } else {
        setUserVote(null);
      }
    } catch (error: any) {
      // 404 means user hasn't voted yet, which is fine
      if (error.response?.status !== 404) {
        console.error('Error fetching user vote:', error);
      }
      setUserVote(null);
    }
  };

  const isOwner = project && connected && publicKey && publicKey.toString() === project.owner_wallet;

  const handleSaveEdit = async () => {
    if (!isOwner || !publicKey) {
      setError('Only project owner can edit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.patch(
        `${API_URL}/api/projects/${params.id}`,
        {
          name: editForm.name,
          description: editForm.description,
          contract_address: editForm.contract_address || null,
          twitter_url: editForm.twitter_url || null,
          website_url: editForm.website_url || null,
          github_url: editForm.github_url || null,
          owner_wallet: publicKey.toString(),
        }
      );

      setProject(response.data);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!isOwner || !publicKey) {
      setError('Only project owner can upload logo');
      return;
    }

    setUploadingLogo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('owner_wallet', publicKey.toString());

      const response = await axios.post(
        `${API_URL}/api/projects/${params.id}/logo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setProject(response.data);
      setLogoFile(null);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFileUpload = async () => {
    if (!isOwner || !publicKey || !uploadFile || !uploadDocType) {
      setError('Please fill all fields');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('project_id', params.id as string);
      formData.append('doc_type', uploadDocType);
      formData.append('owner_wallet', publicKey.toString());

      await axios.post(`${API_URL}/api/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh documents
      const docsRes = await axios.get(`${API_URL}/api/documents/project/${params.id}`);
      setDocuments(docsRes.data);
      
      // Refresh project data (score might have changed)
      const projectRes = await axios.get(`${API_URL}/api/projects/${params.id}`);
      setProject(projectRes.data);

      // Reset form
      setUploadFile(null);
      setUploadDocType('');
      setShowUploadModal(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleVote = async (voteType: 'Upvote' | 'Downvote') => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet to vote');
      return;
    }

    // Check if user already voted
    if (userVote !== null) {
      setError('You have already voted on this project. Each wallet can only vote once per project.');
      return;
    }

    setVoting(true);
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
        false,
        TOKEN_PROGRAM_ID
      );
      
      // Check if token account exists and has sufficient balance
      try {
        const tokenAccountInfo = await getAccount(connection, userTokenAccount);
        if (tokenAccountInfo.amount < BigInt(VOTE_BURN_AMOUNT)) {
          setError(`Insufficient CLRO tokens. You need at least 10 CLRO tokens to vote.`);
          setVoting(false);
          return;
        }
      } catch (error: any) {
        setError(`You don't have any CLRO tokens. Please acquire at least 10 CLRO tokens to vote.`);
        setVoting(false);
        return;
      }
      
      // Create burn instruction to burn CLRO tokens
      const burnInstruction = createBurnInstruction(
        userTokenAccount,
        clroMint,
        publicKey,
        VOTE_BURN_AMOUNT,
        [],
        TOKEN_PROGRAM_ID
      );
      
      // Create transaction with burn instruction
      const transaction = new Transaction().add(burnInstruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      // Record vote with transaction signature
      await axios.post(`${API_URL}/api/voting`, {
        project_id: params.id,
        voter_wallet: publicKey.toString(),
        vote_type: voteType,
        amount: VOTE_BURN_AMOUNT,
        transaction_signature: signature,
      });

      // Update user vote and refresh project data
      setUserVote(voteType);
      await fetchProjectData();
      await fetchUserVote(); // Refresh to ensure consistency
    } catch (error: any) {
      console.error('Voting error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };

  const getBadgeColor = (score: number) => {
    if (score >= 90) return 'text-purple-600';
    if (score >= 75) return 'text-[#64748b]';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 45) return 'text-[#94a3b8]';
    if (score >= 30) return 'text-[#2b76f0]';
    return 'text-[#94a3b8]';
  };

  const getBadgeName = (score: number) => {
    if (score >= 90) return 'Diamond';
    if (score >= 75) return 'Platinum';
    if (score >= 60) return 'Gold';
    if (score >= 45) return 'Silver';
    if (score >= 30) return 'Bronze';
    return 'New'; // Changed from "Unverified" to avoid confusion with on-chain verification status
  };

  if (loading && !project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#64748b] text-xl">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#64748b] text-xl">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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
              <Link href="/projects" className="text-sm font-medium text-[#1a1a1a]">Projects</Link>
              <Link href="/verify" className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition">Verify</Link>
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
                    className="text-sm font-medium text-[#1a1a1a] transition py-2"
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
                  <div className="pt-2 border-t border-[#e5e7eb] mt-2">
                    <WalletAuthButtons />
                  </div>
                </nav>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-12">
        <Link href="/projects" className="inline-flex items-center gap-2 text-[#64748b] hover:text-[#1a1a1a] mb-8 transition text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        
        {/* Project Header */}
        <div className="bg-white border-2 border-[#e5e7eb] p-8 rounded-2xl shadow-sm mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20"
                    placeholder="Project name"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 resize-none"
                    rows={3}
                    placeholder="Project description"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={loading}
                      className="px-4 py-2 bg-[#2b76f0] text-white rounded-lg hover:bg-[#2563eb] transition flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({ 
                          name: project.name, 
                          description: project.description, 
                          contract_address: project.contract_address || '',
                          twitter_url: project.twitter_url || '',
                          website_url: project.website_url || '',
                          github_url: project.github_url || ''
                        });
                      }}
                      className="px-4 py-2 bg-[#f8fafc] border border-[#e5e7eb] text-[#64748b] rounded-lg hover:bg-[#f1f5f9] transition flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                  {isOwner && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#475569] mb-2">Contract Address (Optional)</label>
                        <input
                          type="text"
                          value={editForm.contract_address}
                          onChange={(e) => setEditForm({ ...editForm, contract_address: e.target.value })}
                          className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 font-mono text-sm"
                          placeholder="Solana program/contract address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#475569] mb-2">Twitter/X URL (Optional)</label>
                        <input
                          type="url"
                          value={editForm.twitter_url}
                          onChange={(e) => setEditForm({ ...editForm, twitter_url: e.target.value })}
                          className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20"
                          placeholder="https://twitter.com/yourproject"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#475569] mb-2">Website URL (Optional)</label>
                        <input
                          type="url"
                          value={editForm.website_url}
                          onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                          className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20"
                          placeholder="https://yourproject.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#475569] mb-2">GitHub URL (Optional)</label>
                        <input
                          type="url"
                          value={editForm.github_url}
                          onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
                          className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20"
                          placeholder="https://github.com/yourproject"
                        />
                        <p className="mt-1 text-xs text-[#64748b]">Add your GitHub repository URL (5 points)</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4 mb-4">
                    {project.logo_url ? (
                      <img
                        src={`${API_URL}${project.logo_url}`}
                        alt={project.name}
                        className="w-20 h-20 rounded-xl object-cover border border-[#e5e7eb]"
                      />
                    ) : isOwner ? (
                      <div className="relative">
                        <div className="w-20 h-20 rounded-xl bg-[#f8fafc] border-2 border-dashed border-[#e5e7eb] flex items-center justify-center">
                          <Upload className="w-8 h-8 text-[#94a3b8]" />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLogoFile(file);
                              handleLogoUpload(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    ) : null}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-display text-[#0f172a]">
                          {project.name}
                        </h1>
                        {isOwner && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-[#64748b] hover:text-[#1a1a1a] hover:bg-[#f8fafc] rounded-lg transition"
                            title="Edit project"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {project.verified && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#eff6ff] border border-[#2b76f0]/20 text-[#2b76f0] text-sm rounded-lg font-semibold">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="text-right ml-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className={`w-6 h-6 ${getBadgeColor(project.transparency_score)}`} />
                <span className={`text-xl font-bold ${getBadgeColor(project.transparency_score)}`}>
                  {getBadgeName(project.transparency_score)}
                </span>
              </div>
              <div className="text-[#64748b]">
                Score: {project.transparency_score}/100
              </div>
            </div>
          </div>

          {!isEditing && (
            <>
              <p className="text-[#475569] mb-4">{project.description}</p>
              
              {/* Social Links & Contract */}
              {(project.twitter_url || project.website_url || project.github_url || project.contract_address) && (
                <div className="mb-4 flex flex-wrap gap-3">
                  {project.twitter_url && (
                    <a
                      href={project.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg hover:bg-[#f1f5f9] transition text-sm text-[#64748b] hover:text-[#1a1a1a]"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter/X
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {project.website_url && (
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg hover:bg-[#f1f5f9] transition text-sm text-[#64748b] hover:text-[#1a1a1a]"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg hover:bg-[#f1f5f9] transition text-sm text-[#64748b] hover:text-[#1a1a1a]"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {project.contract_address && (
                    <div className="px-3 py-2 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg">
                      <div className="text-xs font-medium text-[#64748b] mb-1">Contract</div>
                      <div className="text-xs font-mono text-[#1a1a1a] break-all max-w-xs">{project.contract_address}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Verification Transparency Info */}
              {project.verified && project.verified_by_wallet && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <Wallet className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-green-800 mb-1">Verified by Wallet</div>
                      <div className="text-sm font-mono text-green-700 break-all">
                        {project.verified_by_wallet}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        This project was verified on-chain by the wallet address above
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Voting Section */}
          <div className="border-t border-[#e5e7eb] pt-6">
            <h3 className="text-lg font-semibold text-[#0f172a] mb-4">Community Votes</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleVote('Upvote')}
                disabled={!connected || voting || userVote !== null}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  userVote === 'Upvote'
                    ? 'bg-[#2b76f0] text-white shadow-md'
                    : 'bg-[#f8fafc] border border-[#e5e7eb] text-[#475569] hover:border-[#2b76f0]/30 hover:bg-[#eff6ff]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <TrendingUp className="w-5 h-5" />
                {voteStats?.upvotes || 0}
              </button>
              <button
                onClick={() => handleVote('Downvote')}
                disabled={!connected || voting || userVote !== null}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  userVote === 'Downvote'
                    ? 'bg-[#2b76f0] text-white shadow-md'
                    : 'bg-[#f8fafc] border border-[#e5e7eb] text-[#475569] hover:border-[#2b76f0]/30 hover:bg-[#eff6ff]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <TrendingDown className="w-5 h-5" />
                {voteStats?.downvotes || 0}
              </button>
              {!connected && (
                <span className="text-[#64748b] text-sm">
                  Connect wallet to vote (10 CLRO tokens per vote)
                </span>
              )}
              {voting && (
                <span className="text-[#64748b] text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing vote...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white border-2 border-[#e5e7eb] p-8 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display text-[#0f172a]">Documents</h2>
            {isOwner && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2b76f0] text-white rounded-lg hover:bg-[#2563eb] transition shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" />
                Upload Document
              </button>
            )}
          </div>

          {documents.length === 0 ? (
            <p className="text-[#64748b]">No documents uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg hover:border-[#2b76f0]/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#2b76f0]" />
                    <div>
                      <div className="text-[#0f172a] font-semibold">{doc.doc_type}</div>
                      <div className="text-[#64748b] text-sm">
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`${API_URL}${doc.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#2b76f0] text-white rounded-lg hover:bg-[#2563eb] transition shadow-sm hover:shadow-md"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold text-[#0f172a]">Upload Document</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadDocType('');
                  setError('');
                }}
                className="text-[#64748b] hover:text-[#1a1a1a] transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 bg-white"
                >
                  <option value="">Select document type...</option>
                  <option value="Whitepaper">Whitepaper (10 points)</option>
                  <option value="Audit Report">Audit Report (10 points)</option>
                  <option value="Roadmap">Roadmap (8 points)</option>
                  <option value="Tokenomics">Tokenomics (8 points)</option>
                  <option value="Financial Transparency">Financial Transparency (8 points)</option>
                  <option value="Monthly Report">Monthly Report (6 points)</option>
                  <option value="Team Members">Team Members (5 points)</option>
                  <option value="Other">Other (3 points)</option>
                </select>
                <p className="mt-1 text-xs text-[#64748b]">Select the document type to get transparency score points</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">File</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt,.md"
                  className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20"
                />
              </div>

              <button
                onClick={handleFileUpload}
                disabled={uploading || !uploadFile || !uploadDocType}
                className="w-full px-4 py-2 bg-[#2b76f0] text-white rounded-lg hover:bg-[#2563eb] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
