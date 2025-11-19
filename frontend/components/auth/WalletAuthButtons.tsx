'use client';

import { useState } from 'react';
import { useWalletAuth } from '@/contexts/WalletAuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { WalletMenu } from './WalletMenu';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export function WalletAuthButtons() {
  const { profile, loading, authenticated, authenticate } = useWalletAuth();
  const { connected, publicKey } = useWallet();
  const [authenticating, setAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    if (!connected || !publicKey) {
      return;
    }
    setAuthenticating(true);
    try {
      await authenticate();
    } catch (error: any) {
      console.error('Authentication failed:', error);
      alert(error.message || 'Failed to authenticate. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  };

  if (loading) {
    return <div className="w-20 h-10"></div>; // Placeholder while loading
  }

  if (authenticated && profile) {
    return <WalletMenu />;
  }

  return (
    <div className="flex items-center gap-3">
      <WalletMultiButton className="!bg-[#3b82f6] hover:!bg-[#2563eb] !text-white !rounded-lg !px-4 !py-2 !text-sm !font-semibold !shadow-sm hover:!shadow-md !transition" />
      {connected && publicKey && !authenticated && (
        <button
          onClick={handleAuthenticate}
          disabled={authenticating}
          className="bg-[#10b981] text-white px-5 py-2.5 rounded-md text-sm font-semibold shadow-sm hover:bg-[#059669] hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {authenticating ? 'Authenticating...' : 'Sign In'}
        </button>
      )}
    </div>
  );
}


