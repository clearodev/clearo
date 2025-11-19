'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { ArrowLeft, Wallet, Plus, Trash2, Star, Copy, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Footer } from '@/components/Footer';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export default function WalletsPage() {
  const { user, wallets, loading: authLoading, linkWallet, unlinkWallet, setPrimaryWallet, refreshUser } = useAuth();
  const { publicKey, connected, wallet } = useWallet();
  const [linking, setLinking] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, [user, refreshUser]);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleLinkWallet = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please log in first' });
      return;
    }

    if (!connected || !publicKey) {
      setMessage({ type: 'error', text: 'Please connect your wallet first using the button below' });
      return;
    }

    // Check if wallet is already linked
    const walletAddress = publicKey.toString();
    const isAlreadyLinked = wallets.some(w => w.wallet_address === walletAddress);
    
    if (isAlreadyLinked) {
      setMessage({ type: 'error', text: 'This wallet is already linked to your account' });
      return;
    }

    setLinking(true);
    setMessage(null);

    try {
      const walletName = wallet?.adapter?.name || 'Unknown';
      await linkWallet(walletAddress, walletName);
      setMessage({ type: 'success', text: 'Wallet linked successfully!' });
      await refreshUser();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to link wallet' });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkWallet = async (address: string) => {
    if (!confirm('Are you sure you want to unlink this wallet?')) {
      return;
    }

    try {
      await unlinkWallet(address);
      setMessage({ type: 'success', text: 'Wallet unlinked successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to unlink wallet' });
    }
  };

  const handleSetPrimary = async (address: string) => {
    try {
      await setPrimaryWallet(address);
      setMessage({ type: 'success', text: 'Primary wallet updated' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to set primary wallet' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#64748b] text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <p className="text-[#64748b] text-xl mb-4">Login required for wallet linking</p>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Why login?</strong> Wallet linking requires a login account to associate multiple wallets with one profile.
            </p>
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> You can still use your wallet for all blockchain actions (create projects, verify, vote) without logging in. Login is only needed for profile features like wallet linking, avatar, and email verification.
            </p>
          </div>
          <Link href="/" className="text-[#2b76f0] hover:text-[#2563eb]">
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e5e7eb]">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <img src="/icon.svg" alt="Clearo" className="w-8 h-8" />
              <span className="text-xl font-display tracking-tight bg-gradient-to-r from-[#2b76f0] to-[#2b76f0] bg-clip-text text-transparent">
                Clearo
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-display font-bold text-[#1a1a1a] mb-2">Wallets</h1>
              <p className="text-[#64748b]">Manage your linked Solana wallets</p>
            </div>
            {connected && publicKey && (
              <button
                onClick={handleLinkWallet}
                disabled={linking}
                className="flex items-center gap-2 px-4 py-2 bg-[#2b76f0] text-white rounded-lg font-semibold hover:bg-[#2563eb] transition disabled:opacity-50"
              >
                {linking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Link Wallet
                  </>
                )}
              </button>
            )}
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Wallet Connection Section */}
          <div className="mb-8 p-6 bg-[#eff6ff] border border-[#2b76f0]/20 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">Connect Wallet</h3>
                <p className="text-sm text-[#64748b]">
                  Connect your Solana wallet (Phantom, Solflare, etc.) to link it to your account
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <WalletMultiButton className="!bg-[#2b76f0] hover:!bg-[#2563eb] !text-white !rounded-md !px-5 !py-2.5 !text-sm !font-semibold !shadow-sm hover:!shadow-md !transition" />
              
              {connected && publicKey && (
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm font-medium text-green-700">Connected</span>
                  </div>
                  <code className="text-sm text-[#64748b] font-mono">
                    {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                  </code>
                  {!wallets.some(w => w.wallet_address === publicKey.toString()) && (
                    <button
                      onClick={handleLinkWallet}
                      disabled={linking}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2b76f0] text-white rounded-lg font-semibold hover:bg-[#2563eb] transition disabled:opacity-50 text-sm"
                    >
                      {linking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Linking...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Link This Wallet
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {connected && publicKey && wallets.some(w => w.wallet_address === publicKey.toString()) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  ✓ This wallet is already linked to your account
                </p>
              </div>
            )}
          </div>

          {/* Linked Wallets List */}
          {wallets.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[#e5e7eb] rounded-lg">
              <Wallet className="w-12 h-12 text-[#94a3b8] mx-auto mb-4" />
              <p className="text-[#64748b] text-lg mb-2">No wallets linked yet</p>
              <p className="text-[#94a3b8] text-sm">Connect and link your first wallet to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wallets.map((wallet) => (
                <motion.div
                  key={wallet.wallet_address}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 border border-[#e5e7eb] rounded-lg hover:border-[#2b76f0]/30 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Wallet className="w-5 h-5 text-[#2b76f0]" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#1a1a1a]">
                              {wallet.wallet_name || 'Unknown Wallet'}
                            </span>
                            {wallet.is_primary && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#2b76f0]/10 text-[#2b76f0] text-xs font-medium rounded">
                                <Star className="w-3 h-3 fill-[#2b76f0]" />
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm text-[#64748b] font-mono">
                              {wallet.wallet_address.slice(0, 8)}...{wallet.wallet_address.slice(-8)}
                            </code>
                            <button
                              onClick={() => handleCopyAddress(wallet.wallet_address)}
                              className="p-1 hover:bg-[#f8fafc] rounded transition"
                              title="Copy address"
                            >
                              {copiedAddress === wallet.wallet_address ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-[#64748b]" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-[#94a3b8] mt-2">
                            Linked {new Date(wallet.linked_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!wallet.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(wallet.wallet_address)}
                          className="px-3 py-1.5 text-sm border border-[#e5e7eb] text-[#475569] rounded-lg hover:bg-[#f8fafc] transition"
                          title="Set as primary"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => handleUnlinkWallet(wallet.wallet_address)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Unlink wallet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

