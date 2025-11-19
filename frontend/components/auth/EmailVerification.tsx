'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface EmailVerificationProps {
  onClose: () => void;
}

export function EmailVerification({ onClose }: EmailVerificationProps) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleResend = async () => {
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_URL}/api/auth/send-verification`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };


  if (user?.emailVerified) {
    return null;
  }

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
              Email verified!
            </h2>
            <p className="text-[#64748b] mb-6">
              Your email has been verified successfully.
            </p>
          </div>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-[#1a1a1a] mb-2">
              Verify your email
            </h2>
            <p className="text-[#64748b] mb-6">
              We've sent a verification email to <strong>{user?.email}</strong>. Please check your inbox and click the verification link.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleResend}
                disabled={loading}
                className="w-full bg-[#3b82f6] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2563eb] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend verification email'
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full text-[#64748b] py-2.5 rounded-lg font-medium hover:text-[#1a1a1a] transition"
              >
                I'll verify later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}

