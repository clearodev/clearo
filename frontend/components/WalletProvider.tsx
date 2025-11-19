'use client';

import { useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [showHttpsWarning, setShowHttpsWarning] = useState(false);

  // Check if HTTPS is required
  useEffect(() => {
    // Check if we're on HTTP (not localhost) - wallets require HTTPS
    if (typeof window !== 'undefined') {
      const isHttp = window.location.protocol === 'http:';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isHttp && !isLocalhost) {
        console.warn('⚠️ Wallet connections require HTTPS. Some wallets may not work on HTTP.');
        setShowHttpsWarning(true);
      }
    }
  }, []);

  // Using library default styles - no custom overrides
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => {
    // Use environment variable if set (check both possible variable names)
    const customEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    if (customEndpoint) {
      return customEndpoint;
    }
    if (network === WalletAdapterNetwork.Mainnet) {
      return 'https://api.mainnet-beta.solana.com';
    }
    return 'https://api.devnet.solana.com';
  }, [network]);

  const wallets = useMemo(
    () => {
      try {
        // Phantom auto-registers itself, so we only need to explicitly add Solflare
        return [
          new SolflareWalletAdapter(),
        ];
      } catch (error) {
        console.error('Error initializing wallets:', error);
        return [];
      }
    },
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider 
        wallets={wallets} 
        autoConnect={false}
        onError={(error) => {
          console.error('Wallet error:', error);
          // Handle different types of errors
          if (error.name === 'WalletConnectionError' || 
              error.message?.includes('User rejected') ||
              error.message?.includes('rejected') ||
              error.message?.includes('cancelled')) {
            // User cancelled or connection failed - this is normal, state will reset automatically
            console.log('Wallet connection cancelled or rejected by user');
            return;
          }
          // Handle timeout or network errors
          if (error.message?.includes('timeout') || 
              error.message?.includes('network') ||
              error.message?.includes('HTTPS') ||
              error.message?.includes('secure context') ||
              error.message?.includes('connecting')) {
            console.warn('Wallet connection failed - likely due to HTTPS requirement or network issue');
            // Show HTTPS warning if not already shown
            if (typeof window !== 'undefined') {
              const isHttp = window.location.protocol === 'http:';
              const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
              if (isHttp && !isLocalhost) {
                setShowHttpsWarning(true);
              }
            }
            // State should reset automatically, but log for debugging
            return;
          }
          // Log other errors for debugging
          console.error('Unexpected wallet error:', error);
        }}
      >
        <WalletModalProvider>
          {showHttpsWarning && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-2xl mx-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                      HTTPS Required for Wallet Connection
                    </h3>
                    <p className="text-sm text-yellow-700 mb-2">
                      Phantom and other Solana wallets require HTTPS to connect. You're currently accessing the site via HTTP.
                    </p>
                    <p className="text-xs text-yellow-600 mb-3">
                      <strong>Solution:</strong> Set up HTTPS using a reverse proxy (nginx) with Let's Encrypt SSL certificate, or use a service like Cloudflare.
                    </p>
                    <button
                      onClick={() => setShowHttpsWarning(false)}
                      className="text-xs text-yellow-800 hover:text-yellow-900 font-medium underline"
                    >
                      Dismiss
                    </button>
                  </div>
                  <button
                    onClick={() => setShowHttpsWarning(false)}
                    className="flex-shrink-0 text-yellow-600 hover:text-yellow-800"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

