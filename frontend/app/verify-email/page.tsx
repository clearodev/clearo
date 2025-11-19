'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await axios.post(`${API_URL}/api/auth/verify-email`, { token });
        
        // Only set success if the API call was successful
        if (response.status === 200) {
          setStatus('success');
          setMessage('Email verified successfully!');
          
          // Refresh user data (don't fail if this errors)
          try {
            await refreshUser();
          } catch (refreshError) {
            console.warn('Failed to refresh user data, but email is verified:', refreshError);
            // Don't show error - email verification was successful
          }
          
          // Redirect after showing success message
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (error: any) {
        // Check if it's already verified (not really an error)
        const errorMessage = error.response?.data?.error || '';
        if (errorMessage.includes('already verified')) {
          setStatus('success');
          setMessage('Email is already verified!');
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(errorMessage || 'Failed to verify email');
        }
      }
    };

    verifyEmail();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-display font-bold text-[#1a1a1a] mb-2">
              Verifying email...
            </h2>
            <p className="text-[#64748b]">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-[#1a1a1a] mb-2">
              Email verified!
            </h2>
            <p className="text-[#64748b] mb-6">{message}</p>
            <p className="text-sm text-[#9ca3af]">Redirecting to home page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-[#1a1a1a] mb-2">
              Verification failed
            </h2>
            <p className="text-[#64748b] mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-[#3b82f6] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2563eb] transition"
            >
              Go to home page
            </button>
          </>
        )}
      </div>
    </div>
  );
}

