'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import bs58 from 'bs58';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface WalletProfile {
  walletAddress: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

interface WalletAuthContextType {
  profile: WalletProfile | null;
  token: string | null;
  loading: boolean;
  authenticated: boolean;
  authenticate: () => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (username?: string, fullName?: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const WalletAuthContext = createContext<WalletAuthContextType | undefined>(undefined);

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('wallet_token');
    setToken(null);
    setProfile(null);
    if (disconnect) {
      disconnect();
    }
  }, [disconnect]);

  const fetchProfile = useCallback(async (authToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/wallet/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setProfile(response.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Token invalid, clear it
        logout();
      }
      throw error;
    }
  }, [logout]);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('wallet_token');
    if (storedToken) {
      setToken(storedToken);
      fetchProfile(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  // Auto-authenticate when wallet connects and we have a token
  useEffect(() => {
    if (connected && publicKey && token && !profile) {
      fetchProfile(token).catch(() => {
        // If profile fetch fails, token might be invalid
        logout();
      });
    } else if (!connected && token) {
      // Wallet disconnected but we have token - clear it
      logout();
    }
  }, [connected, publicKey, token, profile, fetchProfile, logout]);

  const authenticate = async () => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected');
    }

    if (authenticating) {
      return; // Prevent duplicate authentication attempts
    }

    setAuthenticating(true);
    try {
      // Get auth message from backend
      const messageResponse = await axios.post(`${API_URL}/api/wallet/auth-message`, {
        walletAddress: publicKey.toString(),
      });

      const message = messageResponse.data.message;

      // Sign message with wallet
      // Solana wallets expect Uint8Array
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);

      // Convert signature to base58 string
      // signature is already Uint8Array from signMessage
      const signatureString = bs58.encode(signature);

      // Authenticate with backend
      const authResponse = await axios.post(`${API_URL}/api/wallet/authenticate`, {
        walletAddress: publicKey.toString(),
        signature: signatureString,
        message,
      });

      const { token: authToken, profile: userProfile } = authResponse.data;

      // Store token and profile
      localStorage.setItem('wallet_token', authToken);
      setToken(authToken);
      setProfile(userProfile);
    } catch (error: any) {
      console.error('Authentication error:', error);
      throw error;
    } finally {
      setAuthenticating(false);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    await fetchProfile(token);
  };

  const updateProfile = async (username?: string, fullName?: string) => {
    if (!token) throw new Error('Not authenticated');

    try {
      const response = await axios.patch(
        `${API_URL}/api/wallet/profile`,
        { username, fullName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProfile(response.data);
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post(`${API_URL}/api/wallet/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile(response.data);
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };

  return (
    <WalletAuthContext.Provider
      value={{
        profile,
        token,
        loading,
        authenticated: !!token && !!profile,
        authenticate,
        logout,
        refreshProfile,
        updateProfile,
        uploadAvatar,
      }}
    >
      {children}
    </WalletAuthContext.Provider>
  );
}

export function useWalletAuth() {
  const context = useContext(WalletAuthContext);
  if (context === undefined) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider');
  }
  return context;
}

