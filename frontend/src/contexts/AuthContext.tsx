'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '@/config/api';

interface User {
  id: number;
  email: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
}

interface Wallet {
  wallet_address: string;
  wallet_name?: string;
  is_primary: boolean;
  linked_at: string;
}

interface AuthContextType {
  user: User | null;
  wallets: Wallet[];
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string, fullName?: string) => Promise<void>;
  logout: () => void;
  linkWallet: (walletAddress: string, walletName?: string) => Promise<void>;
  unlinkWallet: (walletAddress: string) => Promise<void>;
  setPrimaryWallet: (walletAddress: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setWallets(data.wallets || []);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('auth_token');
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    setWallets([]);
    localStorage.setItem('auth_token', data.token);
    await fetchUser(data.token);
  };

  const signup = async (email: string, password: string, username: string, fullName?: string) => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username, fullName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    setWallets([]);
    localStorage.setItem('auth_token', data.token);
    await fetchUser(data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWallets([]);
    localStorage.removeItem('auth_token');
  };

  const linkWallet = async (walletAddress: string, walletName?: string) => {
    if (!token) {
      throw new Error('You must be logged in to link a wallet');
    }

    const response = await fetch(`${API_URL}/api/auth/link-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ walletAddress, walletName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to link wallet');
    }

    await fetchUser(token);
  };

  const unlinkWallet = async (walletAddress: string) => {
    if (!token) {
      throw new Error('You must be logged in to unlink a wallet');
    }

    const response = await fetch(`${API_URL}/api/auth/wallets/${walletAddress}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unlink wallet');
    }

    await fetchUser(token);
  };

  const setPrimaryWallet = async (walletAddress: string) => {
    if (!token) {
      throw new Error('You must be logged in to set primary wallet');
    }

    const response = await fetch(`${API_URL}/api/auth/wallets/${walletAddress}/primary`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set primary wallet');
    }

    await fetchUser(token);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallets,
        token,
        loading,
        login,
        signup,
        logout,
        linkWallet,
        unlinkWallet,
        setPrimaryWallet,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}






