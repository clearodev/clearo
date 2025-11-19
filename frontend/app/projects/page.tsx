'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Award, ArrowLeft, CheckCircle2, Menu, X, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_URL } from '@/src/config/api';
import { WalletAuthButtons } from '@/components/auth/WalletAuthButtons';
import { Footer } from '@/components/Footer';

interface Project {
  project_id: string;
  name: string;
  description: string;
  logo_url?: string;
  contract_address?: string;
  verified: boolean;
  transparency_score: number;
  owner_wallet: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchProjects();
  }, [debouncedSearchQuery, verifiedFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }
      
      if (verifiedFilter !== 'all') {
        params.verified = verifiedFilter === 'verified';
      }

      const response = await axios.get(`${API_URL}/api/projects`, { params });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeConfig = (score: number) => {
    if (score >= 90) return { name: 'Diamond', color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    if (score >= 75) return { name: 'Platinum', color: '#94a3b8', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
    if (score >= 60) return { name: 'Gold', color: '#fbbf24', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
    if (score >= 45) return { name: 'Silver', color: '#9ca3af', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
    if (score >= 30) return { name: 'Bronze', color: '#fb923c', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    return { name: 'New', color: '#6b7280', bg: 'bg-gray-600/10', border: 'border-gray-600/20' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#64748b]">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e5e7eb]">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between relative">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <img src="/icon.svg" alt="Clearo" className="w-8 h-8" />
              <span className="text-xl font-display tracking-tight bg-gradient-to-r from-[#2b76f0] to-[#2b76f0] bg-clip-text text-transparent">
                Clearo
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-12">
              <Link href="/projects" className="text-sm font-medium text-[#1a1a1a]">Projects</Link>
              <Link href="/verify" className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition">Verify</Link>
              <Link href="/whitepaper" className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition">Whitepaper</Link>
              <WalletAuthButtons />
            </nav>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1a1a1a] hover:opacity-80 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden absolute top-full right-0 mt-2 bg-white border border-[#e5e7eb] rounded-xl shadow-lg p-4 z-50 min-w-[200px]"
              >
                <nav className="flex flex-col gap-4">
                  <Link 
                    href="/projects" 
                    className="text-sm font-medium text-[#1a1a1a] transition py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link 
                    href="/verify" 
                    className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Verify
                  </Link>
                  <Link 
                    href="/whitepaper" 
                    className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Whitepaper
                  </Link>
                  <div className="pt-2 border-t border-[#e5e7eb] mt-2">
                    <WalletAuthButtons />
                  </div>
                </nav>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-[#64748b] hover:text-[#1a1a1a] mb-8 transition text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-6xl md:text-7xl font-display mb-4 tracking-tight text-[#0f172a]">Projects</h1>
          <p className="text-[#64748b] text-lg">Verified projects on Clearo</p>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project name or contract address..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#e5e7eb] rounded-lg focus:border-[#2b76f0] focus:outline-none focus:ring-2 focus:ring-[#2b76f0]/20 transition text-[#1a1a1a] placeholder:text-[#94a3b8]"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#64748b]" />
              <div className="flex gap-2 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg p-1">
                <button
                  onClick={() => setVerifiedFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    verifiedFilter === 'all'
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#1a1a1a]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setVerifiedFilter('verified')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-1 ${
                    verifiedFilter === 'verified'
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#1a1a1a]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </button>
                <button
                  onClick={() => setVerifiedFilter('unverified')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    verifiedFilter === 'unverified'
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#1a1a1a]'
                  }`}
                >
                  Unverified
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-[#64748b]">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-32">
            {debouncedSearchQuery || verifiedFilter !== 'all' ? (
              <>
                <p className="text-[#64748b] text-xl mb-4">No projects found</p>
                <p className="text-[#94a3b8] text-sm mb-8">
                  {debouncedSearchQuery ? `No projects match "${debouncedSearchQuery}"` : 'Try adjusting your filters'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setVerifiedFilter('all');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#f8fafc] border border-[#e5e7eb] text-[#64748b] rounded-lg font-semibold transition hover:bg-[#f1f5f9]"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-[#64748b] text-xl mb-8">No projects yet</p>
                <Link
                  href="/verify"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#2b76f0] hover:bg-[#2563eb] text-white rounded-lg font-semibold transition shadow-md shadow-[#2b76f0]/25 hover:shadow-lg"
                >
                  Be the first
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const badge = getBadgeConfig(project.transparency_score);
              return (
                <motion.div
                  key={project.project_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Link
                    href={`/projects/${project.project_id}`}
                    className="block h-full bg-white border border-[#e5e7eb] rounded-2xl p-6 hover:border-[#2b76f0]/40 hover:shadow-xl transition-all duration-300 relative overflow-hidden shadow-sm"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Header */}
                    <div className="relative z-10 flex items-start gap-3 mb-4">
                      {project.logo_url && (
                        <img
                          src={`${API_URL}${project.logo_url}`}
                          alt={project.name}
                          className="w-12 h-12 rounded-lg object-cover border border-[#e5e7eb] flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 flex justify-between items-start">
                        <h2 className="text-xl font-bold text-[#0f172a] group-hover:text-[#2b76f0] transition-colors duration-300 pr-2">
                          {project.name}
                        </h2>
                        {project.verified && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-[#eff6ff] border border-[#2b76f0]/30 flex items-center justify-center group-hover:bg-[#dbeafe] group-hover:border-[#2b76f0]/50 transition-all duration-300">
                              <CheckCircle2 className="w-5 h-5 text-[#2b76f0]" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="relative z-10 text-[#64748b] text-sm mb-6 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Footer */}
                    <div className="relative z-10 flex items-center justify-between pt-4 border-t border-[#e5e7eb] group-hover:border-[#e5e7eb]/50 transition-colors">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${badge.bg} border ${badge.border} group-hover:scale-105 transition-transform duration-300`}>
                        <Award className="w-4 h-4" style={{ color: badge.color }} />
                        <span className="text-xs font-semibold" style={{ color: badge.color }}>
                          {badge.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#94a3b8] font-mono bg-[#f8fafc] px-2 py-1 rounded">{project.transparency_score}/100</span>
                      </div>
                    </div>
                    
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#2b76f0]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
