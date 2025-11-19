'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useWalletAuth } from '@/contexts/WalletAuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { User, LogOut, Wallet, ChevronDown } from 'lucide-react';
import { API_URL } from '@/src/config/api';

export function WalletMenu() {
  const { profile, logout } = useWalletAuth();
  const { publicKey, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatarUrl]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  if (!profile) return null;

  const displayName = profile.username || profile.walletAddress.slice(0, 8) + '...' + profile.walletAddress.slice(-6);
  const initials = profile.username 
    ? profile.username.charAt(0).toUpperCase()
    : profile.walletAddress.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f8fafc] border border-[#e5e7eb] hover:bg-[#eff6ff] transition"
      >
        {profile.avatarUrl && !avatarError ? (
          <img
            src={`${API_URL}${profile.avatarUrl}`}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover border border-[#e5e7eb]"
            key={profile.avatarUrl}
            onError={() => {
              setAvatarError(true);
            }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-sm font-semibold">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-[#1a1a1a] hidden md:block">{displayName}</span>
        <ChevronDown className="w-4 h-4 text-[#64748b]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e5e7eb] rounded-xl shadow-lg z-50">
          <div className="p-4 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-3">
              {profile.avatarUrl && !avatarError ? (
                <img
                  src={`${API_URL}${profile.avatarUrl}`}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border border-[#e5e7eb]"
                  key={profile.avatarUrl}
                  onError={() => {
                    setAvatarError(true);
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-sm font-semibold">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#1a1a1a] truncate">
                  {profile.username || 'Wallet User'}
                </div>
                {profile.fullName && (
                  <div className="text-xs text-[#64748b] truncate">{profile.fullName}</div>
                )}
                {publicKey && (
                  <div className="text-xs text-[#64748b] font-mono truncate mt-1">
                    {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-6)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 text-sm text-[#1a1a1a] hover:bg-[#f8fafc] rounded-lg transition"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


