'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { X } from 'lucide-react';
import { EmailVerification } from './EmailVerification';

interface SignupFormProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function SignupForm({ onClose, onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const { signup } = useAuth();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, username, fullName || undefined);
      setShowVerification(true);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748b] hover:text-[#1a1a1a] transition"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-display font-bold text-[#1a1a1a] mb-2">Create account</h2>
        <p className="text-[#64748b] mb-4">Sign up to get started</p>
        
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Sign up is optional. You can use your wallet for all blockchain actions (create projects, verify, vote). Sign up adds profile features like avatar, email verification, and wallet linking.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-[#374151] mb-2">
              Full Name (Optional)
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#374151] mb-2">
              Username *
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#374151] mb-2">
              Password * (min 8 characters)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3b82f6] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2563eb] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#64748b]">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-[#3b82f6] hover:text-[#2563eb] font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <>
      {createPortal(modalContent, document.body)}
      {showVerification && (
        <EmailVerification onClose={() => {
          setShowVerification(false);
          onClose();
        }} />
      )}
    </>
  );
}

