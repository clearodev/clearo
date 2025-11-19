'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';

interface ForgotPasswordFormProps {
  onClose: () => void;
}

export function ForgotPasswordForm({ onClose }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send password reset email');
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

        {success ? (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-[#1a1a1a] mb-2">
              Check your email
            </h2>
            <p className="text-[#64748b] mb-6">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[#3b82f6] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2563eb] transition"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-[#1a1a1a] mb-2">
              Forgot password?
            </h2>
            <p className="text-[#64748b] mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-2">
                  Email
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3b82f6] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2563eb] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#64748b]">
              Remember your password?{' '}
              <button
                onClick={onClose}
                className="text-[#3b82f6] hover:text-[#2563eb] font-medium"
              >
                Back to login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}

