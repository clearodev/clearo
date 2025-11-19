'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

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
  const fetchingUserRef = useRef(false);

  // Load token from localStorage on mount - only run once
  useEffect(() => {
    let mounted = true;
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedToken) {
      setToken(storedToken);
      // Prevent duplicate calls (React StrictMode runs effects twice in dev)
      if (!fetchingUserRef.current && mounted) {
        fetchUser(storedToken).catch((error) => {
          console.error('Initial user fetch failed:', error);
          // Ensure loading is set to false even on error
          if (mounted) {
            setLoading(false);
          }
        });
      } else {
        // If fetchUser is already in progress or was skipped, still set loading to false
        if (mounted) {
          setLoading(false);
        }
      }
    } else {
      if (mounted) {
        setLoading(false);
      }
    }
    
    return () => {
      mounted = false;
    };
  }, []);

  const fetchUser = async (authToken: string) => {
    // Prevent concurrent calls
    if (fetchingUserRef.current) {
      console.log('fetchUser already in progress, skipping');
      // Still set loading to false so UI can render
      setLoading(false);
      return;
    }
    
    fetchingUserRef.current = true;
    
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        cache: 'no-store', // Prevent browser caching
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setWallets(data.wallets || []);
      } else if (response.status === 401 || response.status === 403) {
        // Token invalid or expired, clear it
        console.log('Token invalid or expired, logging out');
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setWallets([]);
      } else if (response.status === 429) {
        // Rate limited - don't clear token, just log and retry later
        console.warn('Rate limited on /api/auth/me, will retry later');
        // Don't clear token or user state - rate limit is temporary
      } else {
        // Other error (500, 404, etc.) - don't clear token, might be temporary
        console.error('Failed to fetch user, status:', response.status);
      }
    } catch (error) {
      // Network error - don't clear token, might be temporary connection issue
      console.error('Failed to fetch user (network error):', error);
      // Only clear token if it's clearly an auth error
      if (error instanceof Error && error.message.includes('401')) {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setWallets([]);
      }
    } finally {
      fetchingUserRef.current = false;
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
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Login failed';
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // Fallback if JSON parsing fails
          errorMessage = 'Login failed';
        }
      } else {
        // If not JSON, try to get text
        try {
          errorMessage = await response.text() || errorMessage;
        } catch (e) {
          // If that also fails, use default message
        }
      }
      
      throw new Error(errorMessage);
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
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Signup failed';
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // Fallback if JSON parsing fails
          errorMessage = 'Signup failed';
        }
      } else {
        // If not JSON, try to get text
        try {
          errorMessage = await response.text() || errorMessage;
        } catch (e) {
          // If that also fails, use default message
        }
      }
      
      throw new Error(errorMessage);
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
    if (token && !fetchingUserRef.current) {
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

