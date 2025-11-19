'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { UserMenu } from './UserMenu';

export function AuthButtons() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  if (loading) {
    return <div className="w-20 h-10"></div>; // Placeholder while loading
  }

  if (user) {
    return <UserMenu />;
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative group">
          <button
            onClick={() => setShowLogin(true)}
            className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition"
          >
            Login
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-[#0f172a] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
            <div className="font-semibold mb-1">Optional Login</div>
            <div className="text-[#cbd5e1]">
              Login is optional. You can use your wallet for all blockchain actions. Login adds profile features like avatar, email, and wallet linking.
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#0f172a]"></div>
          </div>
        </div>
        <button
          onClick={() => setShowSignup(true)}
          className="bg-[#3b82f6] text-white px-5 py-2.5 rounded-md text-sm font-semibold shadow-sm hover:bg-[#2563eb] hover:shadow-md transition"
        >
          Sign Up
        </button>
      </div>

      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}

      {showSignup && (
        <SignupForm
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
}


