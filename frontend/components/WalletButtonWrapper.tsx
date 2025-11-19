'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

interface WalletButtonWrapperProps {
  className?: string;
}

export function WalletButtonWrapper({ className }: WalletButtonWrapperProps) {
  const { connecting, disconnect, wallet } = useWallet();
  const connectingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasConnectingRef = useRef(false);

  useEffect(() => {
    // If wallet is connecting, set a timeout to reset if it takes too long
    if (connecting) {
      wasConnectingRef.current = true;
      
      // Clear any existing timeout
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
      }

      // Set a timeout to reset connection if stuck for more than 15 seconds
      connectingTimeoutRef.current = setTimeout(() => {
        console.warn('Wallet connection timeout - resetting connection state');
        // Disconnect to reset the state
        if (wallet && wallet.adapter) {
          try {
            wallet.adapter.disconnect().catch(() => {
              // Ignore errors during disconnect
            });
          } catch (error) {
            // Ignore errors
          }
        }
        // Also try to disconnect via the hook
        try {
          disconnect().catch(() => {
            // Ignore errors
          });
        } catch (error) {
          // Ignore errors
        }
      }, 15000); // 15 second timeout
    } else {
      // If not connecting anymore, clear the timeout
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
      
      // If we were connecting but now we're not (and no wallet is connected), it failed
      if (wasConnectingRef.current && !wallet) {
        console.log('Wallet connection ended without success');
        wasConnectingRef.current = false;
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
      }
    };
  }, [connecting, wallet, disconnect]);

  return <WalletMultiButton className={className} />;
}






