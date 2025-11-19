'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Wallet, ChevronDown } from 'lucide-react';
import { API_URL } from '@/src/config/api';

export function UserMenu() {
  const { user, logout } = useAuth();
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

  // Reset avatar error when avatarUrl changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f8fafc] border border-[#e5e7eb] hover:bg-[#eff6ff] transition"
      >
        {user.avatarUrl && !avatarError ? (
          <img
            src={`${API_URL}${user.avatarUrl}`}
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover border border-[#e5e7eb]"
            key={user.avatarUrl}
            onError={() => {
              setAvatarError(true);
            }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-sm font-semibold">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-[#1a1a1a] hidden md:block">{user.username}</span>
        <ChevronDown className="w-4 h-4 text-[#64748b]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e5e7eb] rounded-xl shadow-lg z-50">
          <div className="p-4 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-3">
              {user.avatarUrl && !avatarError ? (
                <img
                  src={`${API_URL}${user.avatarUrl}`}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover border border-[#e5e7eb]"
                  key={user.avatarUrl}
                  onError={() => {
                    setAvatarError(true);
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-sm font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">{user.username}</p>
                <p className="text-xs text-[#64748b]">{user.email}</p>
              </div>
            </div>
          </div>
          
          <div className="p-2">
            <Link
              href="/profile"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#475569] hover:bg-[#f8fafc] rounded-lg transition"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            <Link
              href="/wallets"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#475569] hover:bg-[#f8fafc] rounded-lg transition"
              onClick={() => setIsOpen(false)}
            >
              <Wallet className="w-4 h-4" />
              Wallets
            </Link>
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition mt-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

