'use client';

import { useState, useEffect } from 'react';
import { useWalletAuth } from '@/contexts/WalletAuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { ArrowLeft, User, Calendar, Save, Loader2, X, Camera, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { Footer } from '@/components/Footer';
import { API_URL } from '@/src/config/api';

export default function ProfilePage() {
  const { profile, loading: authLoading, refreshProfile, updateProfile, uploadAvatar, authenticated } = useWalletAuth();
  const { connected, publicKey } = useWallet();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setFullName(profile.fullName || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!authenticated) return;

    setSaving(true);
    setMessage(null);

    try {
      await updateProfile(username || undefined, fullName || undefined);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      await refreshProfile();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size too large. Please upload an image smaller than 5MB.' });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    setUploadingAvatar(true);
    setMessage(null);

    try {
      await uploadAvatar(file);
      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
      setAvatarPreview(null);
      await refreshProfile();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message || 'Failed to upload avatar' });
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      e.target.value = '';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#64748b] text-xl">Loading...</div>
      </div>
    );
  }

  if (!authenticated || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <p className="text-[#64748b] text-xl mb-4">Wallet authentication required</p>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Connect your wallet:</strong> Please connect your Solana wallet and sign in to view your profile.
            </p>
            <p className="text-xs text-blue-700">
              Your profile is tied to your wallet address. Connect your wallet and authenticate to manage your profile.
            </p>
          </div>
          <Link href="/" className="text-[#2b76f0] hover:text-[#2563eb]">
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.username || profile.walletAddress.slice(0, 8) + '...' + profile.walletAddress.slice(-6);
  const initials = profile.username 
    ? profile.username.charAt(0).toUpperCase()
    : profile.walletAddress.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e5e7eb]">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <img src="/icon.svg" alt="Clearo" className="w-8 h-8" />
              <span className="text-xl font-display tracking-tight bg-gradient-to-r from-[#2b76f0] to-[#2b76f0] bg-clip-text text-transparent">
                Clearo
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-display font-bold text-[#1a1a1a] mb-2">Profile</h1>
              <p className="text-[#64748b]">Manage your wallet profile</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#2b76f0] text-white rounded-lg font-semibold hover:bg-[#2563eb] transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile.avatarUrl && !avatarPreview ? (
                  <img
                    src={`${API_URL}${profile.avatarUrl}`}
                    alt={displayName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#e5e7eb]"
                  />
                ) : avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#2b76f0]"
                    />
                    <button
                      onClick={() => {
                        setAvatarPreview(null);
                      }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#2b76f0] flex items-center justify-center text-white text-2xl font-bold border-2 border-[#e5e7eb]">
                    {initials}
                  </div>
                )}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-[#2b76f0] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2563eb] transition shadow-lg">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#1a1a1a]">{displayName}</h2>
                {publicKey && (
                  <div className="flex items-center gap-2 mt-1">
                    <Wallet className="w-4 h-4 text-[#64748b]" />
                    <span className="text-sm text-[#64748b] font-mono">
                      {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-6)}
                    </span>
                  </div>
                )}
                {isEditing && (
                  <p className="text-xs text-[#64748b] mt-1">
                    Click camera icon to upload profile picture (max 5MB)
                  </p>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-[#e5e7eb]">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#64748b] mb-2">
                  <User className="w-4 h-4" />
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                    placeholder="Choose a username"
                  />
                ) : (
                  <div className="text-[#1a1a1a] font-medium">
                    {profile.username || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#64748b] mb-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                    placeholder="Your full name"
                  />
                ) : (
                  <div className="text-[#1a1a1a] font-medium">
                    {profile.fullName || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#64748b] mb-2">
                  <Wallet className="w-4 h-4" />
                  Wallet Address
                </label>
                <div className="text-[#1a1a1a] font-mono text-sm break-all">
                  {profile.walletAddress}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#64748b] mb-2">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </label>
                <div className="text-[#1a1a1a] font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex items-center gap-3 pt-6 border-t border-[#e5e7eb]">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#2b76f0] text-white rounded-lg font-semibold hover:bg-[#2563eb] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setUsername(profile.username || '');
                    setFullName(profile.fullName || '');
                    setAvatarPreview(null);
                  }}
                  className="px-6 py-2.5 border border-[#e5e7eb] text-[#64748b] rounded-lg font-semibold hover:bg-[#f8fafc] transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
