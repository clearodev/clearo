'use client';

import Link from 'next/link';
import { Shield, FileText, TrendingUp, Award, ArrowRight, Sparkles, Zap, Lock, CheckCircle2, Menu, X } from 'lucide-react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { WalletAuthButtons } from '@/components/auth/WalletAuthButtons';
import { Footer } from '@/components/Footer';

// Randomized text component
function RandomizedText({ text, className = '' }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

  useEffect(() => {
    if (inView && !isAnimating) {
      setIsAnimating(true);
      let iterations = 0;
      const maxIterations = 20;
      
      const interval = setInterval(() => {
        setDisplayText(
          text
            .split('')
            .map((_, index) => {
              if (index < iterations) {
                return text[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );

        if (iterations >= text.length) {
          clearInterval(interval);
          setDisplayText(text);
          setTimeout(() => setIsAnimating(false), 1000);
        }

        iterations += 1 / 3;
      }, 30);

      return () => clearInterval(interval);
    } else if (!inView && isAnimating) {
      setDisplayText('');
      setIsAnimating(false);
    }
  }, [inView, text, isAnimating]);

  return (
    <span ref={ref} className={className}>
      {displayText || text}
    </span>
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] overflow-hidden relative">
      {/* Rich background layers for depth */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Base grid pattern - stronger */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(43, 118, 240, 0.2) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(43, 118, 240, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Secondary grid pattern - rotated */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(43, 118, 240, 0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(43, 118, 240, 0.15) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          transform: 'rotate(45deg)',
          transformOrigin: 'center'
        }}></div>
        
        {/* Diagonal pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(43, 118, 240, 0.08) 10px,
            rgba(43, 118, 240, 0.08) 20px
          )`
        }}></div>
        
        {/* Strong gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff]/60 via-[#eff6ff]/20 to-[#eff6ff]/60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#eff6ff]/30 via-transparent to-[#eff6ff]/30"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#eff6ff]/40 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-[#eff6ff]/40"></div>
        
        {/* Large radial gradients for depth - stronger */}
        <div className="absolute top-0 left-1/4 w-[1000px] h-[1000px] bg-[#2b76f0]/12 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[900px] h-[900px] bg-[#2b76f0]/12 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 right-0 w-[700px] h-[700px] bg-[#2b76f0]/10 rounded-full blur-[100px] translate-x-1/2"></div>
        <div className="absolute bottom-1/3 left-0 w-[800px] h-[800px] bg-[#2b76f0]/10 rounded-full blur-[100px] -translate-x-1/2"></div>
        <div className="absolute top-1/3 left-1/2 w-[600px] h-[600px] bg-[#2b76f0]/8 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Additional depth layers with different opacities */}
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-[#2b76f0]/6 rounded-full blur-[90px]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-[550px] h-[550px] bg-[#2b76f0]/6 rounded-full blur-[90px]"></div>
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}></div>
        
        {/* Vignette effect for depth */}
        <div className="absolute inset-0 bg-radial-gradient(circle_at_center,_transparent_0%,_transparent_40%,_rgba(59,130,246,0.03)_100%)"></div>
      </div>

      {/* Header with professional glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
        <div className="w-full max-w-7xl mx-auto px-8">
          <div className="relative border border-[#e5e7eb] backdrop-blur-xl bg-white/80 shadow-sm rounded-2xl px-8 py-4">
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/70 rounded-2xl"></div>
            <div className="absolute inset-0 backdrop-blur-xl rounded-2xl -z-10"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
                <img src="/icon.svg" alt="Clearo" className="w-8 h-8" />
                <span className="text-xl font-display tracking-tight bg-gradient-to-r from-[#2b76f0] to-[#2b76f0] bg-clip-text text-transparent">
                  Clearo
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-12">
                <Link href="/projects" className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition">Projects</Link>
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
            </div>
            
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
                    className="text-sm font-medium text-[#4b5563] hover:text-[#1a1a1a] transition py-2"
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-32 pb-32 overflow-hidden bg-gradient-to-b from-white via-[#fafafa] to-white">
        {/* Enhanced background blobs with parallax - larger and stronger */}
        <motion.div 
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, -100]) }}
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#2b76f0]/15 rounded-full blur-[120px] animate-blob"
        ></motion.div>
        <motion.div 
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, 80]) }}
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#2b76f0]/15 rounded-full blur-[120px] animate-blob animation-delay-2000"
        ></motion.div>
        <motion.div 
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, -60]) }}
          className="absolute top-1/2 right-1/3 w-[450px] h-[450px] bg-[#2b76f0]/12 rounded-full blur-[100px] animate-blob animation-delay-4000"
        ></motion.div>
        <motion.div 
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, 40]) }}
          className="absolute top-1/3 left-1/2 w-[400px] h-[400px] bg-[#2b76f0]/10 rounded-full blur-[90px] animate-blob animation-delay-1000"
        ></motion.div>
        
        {/* Additional depth layers - stronger - behind animations */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#3b82f6]/8 via-[#3b82f6]/3 to-transparent z-[1]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-transparent via-[#3b82f6]/3 to-[#3b82f6]/8 z-[1]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#3b82f6]/2 to-transparent z-[1]"></div>
        
        {/* Section-specific gradient overlay - behind animations */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff]/30 via-transparent to-[#eff6ff]/30 z-[1]"></div>
        
        {/* Subtle animated gradient background */}
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute inset-0 opacity-25 z-[2]"
          style={{
            background: 'linear-gradient(45deg, #eff6ff, #dbeafe, #eff6ff)',
            backgroundSize: '300% 300%',
          }}
        ></motion.div>
        
        {/* Security-themed floating icons - balanced */}
        <motion.div
          className="absolute top-1/4 right-1/4 z-[3]"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Shield className="w-10 h-10 text-[#2b76f0]/60 drop-shadow-md" />
        </motion.div>
        
        <motion.div
          className="absolute bottom-1/3 left-1/4 z-[3]"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        >
          <Lock className="w-9 h-9 text-[#2b76f0]/60 drop-shadow-md" />
        </motion.div>
        
        <motion.div
          className="absolute top-1/2 right-1/5 z-[3]"
          animate={{
            y: [0, -15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        >
          <CheckCircle2 className="w-8 h-8 text-[#2b76f0]/60 drop-shadow-md" />
        </motion.div>
        
        {/* Security particles - balanced */}
        {[
          { left: '25%', top: '45%', size: 5, delay: 0, duration: 6 },
          { left: '70%', top: '60%', size: 5, delay: 1.5, duration: 6 },
          { left: '50%', top: '25%', size: 4, delay: 0.8, duration: 5 },
          { left: '65%', top: '75%', size: 4, delay: 2, duration: 5 },
        ].map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full z-[3]"
            style={{
              width: particle.size,
              height: particle.size,
              left: particle.left,
              top: particle.top,
              backgroundColor: '#2b76f0',
              opacity: 0.3,
            }}
            animate={{
              y: [0, -25, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
        
        {/* Subtle pulsing light effect */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#2b76f0]/12 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 z-[2]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.12, 0.2, 0.12],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Subtle security pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] z-[1]" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(43, 118, 240, 0.1) 2px,
            rgba(43, 118, 240, 0.1) 4px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(43, 118, 240, 0.1) 2px,
            rgba(43, 118, 240, 0.1) 4px
          )`,
          backgroundSize: '40px 40px',
        }}></div>

        <div className="container mx-auto px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Text Content */}
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#eff6ff] border border-[#2b76f0]/20 rounded-full mb-8">
                <div className="w-2 h-2 bg-[#2b76f0] rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-[#2b76f0] tracking-wider font-semibold">WEB3 TRANSPARENCY PLATFORM</span>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex items-center justify-center">
                  {/* Pulsing ring effect - expanding circles */}
                  <div className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#2b76f0]/30 animate-pulse-ring"></div>
                  <div className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#2b76f0]/20 animate-pulse-ring" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#2b76f0]/10 animate-pulse-ring" style={{ animationDelay: '1s' }}></div>
                  {/* Logo with glow */}
                  <img 
                    src="/icon.svg" 
                    alt="Clearo" 
                    className="relative w-16 h-16 md:w-20 md:h-20 animate-pulse-glow z-10"
                  />
                </div>
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-display leading-[0.92] tracking-tight bg-gradient-to-r from-[#2b76f0] to-[#2b76f0] bg-clip-text text-transparent">
                  Clearo
                </h1>
              </div>
              
              <p className="text-2xl md:text-3xl font-light text-[#64748b] mb-6 tracking-tight">
                Transparency Platform
              </p>
              
              <p className="text-lg md:text-xl text-[#475569] mb-12 max-w-2xl leading-relaxed font-normal">
                The platform where projects prove ownership, publish transparency materials, 
                and receive community votes powered by blockchain technology.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/projects"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2b76f0] hover:bg-[#2563eb] text-white rounded-lg font-semibold transition-all shadow-md shadow-[#2b76f0]/25 hover:shadow-lg"
                  >
                    Explore Projects
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/verify"
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#2b76f0] hover:bg-[#eff6ff] text-[#2b76f0] rounded-lg font-semibold transition-all"
                  >
                    Verify Project
                  </Link>
                </motion.div>
              </div>

              {/* Quick Feature Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                {[
                  { icon: Shield, label: 'Verified', color: '#3b82f6' },
                  { icon: FileText, label: 'Documents', color: '#3b82f6' },
                  { icon: Zap, label: 'Voting', color: '#3b82f6' }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    whileHover={{ y: -4, scale: 1.05 }}
                    className="bg-white/80 backdrop-blur-sm border border-[#e5e7eb] rounded-xl p-4 hover:border-[#2b76f0]/40 hover:shadow-lg transition-all group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-lg bg-[#eff6ff] border border-[#2b76f0]/20 flex items-center justify-center mb-2 group-hover:bg-[#dbeafe] group-hover:border-[#2b76f0]/40 transition-all">
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <span className="text-sm font-semibold text-[#1a1a1a]">{item.label}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right - Visual Element */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Security card with professional styling */}
                <div className="relative bg-white border-2 border-[#e5e7eb] rounded-2xl p-8 shadow-xl shadow-[#2b76f0]/10">
                  {/* Trust indicator badge */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#2b76f0] text-white text-xs font-bold rounded-full shadow-md">
                    SECURE & VERIFIED
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* Feature cards */}
                    {[
                      { icon: Lock, label: 'Verified', color: '#3b82f6' },
                      { icon: FileText, label: 'Documents', color: '#3b82f6' },
                      { icon: Zap, label: 'Voting', color: '#3b82f6' },
                      { icon: Award, label: 'Scored', color: '#3b82f6' }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: 0.4 + i * 0.1,
                          type: "spring",
                          stiffness: 200,
                          damping: 20
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 hover:border-[#2b76f0]/30 hover:shadow-md transition-all"
                      >
                        <item.icon className="w-8 h-8 mb-2" style={{ color: item.color }} />
                        <div className="text-sm font-semibold text-[#1e293b]">{item.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Security pattern overlay */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none rounded-2xl" style={{
                    backgroundImage: `linear-gradient(rgba(43, 118, 240, 0.3) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(43, 118, 240, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-[#fafafa] to-white">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#eff6ff]/40 via-transparent to-[#eff6ff]/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.05),transparent_70%)]"></div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(43, 118, 240, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(43, 118, 240, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        
        <div className="container mx-auto px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display mb-4 tracking-tight text-[#0f172a]">
              Why Choose Clearo?
            </h2>
            <p className="text-lg text-[#64748b]">Everything you need for Web3 transparency</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'On-Chain Verification',
                description: 'Prove ownership by burning 500 CLRO tokens. Fully automated and trustless verification process.',
                color: '#3b82f6',
                gradient: 'from-blue-500/10 to-blue-600/5'
              },
              {
                icon: FileText,
                title: 'Document Management',
                description: 'Upload and manage all your project documents in one secure, centralized location.',
                color: '#3b82f6',
                gradient: 'from-blue-500/10 to-blue-600/5'
              },
              {
                icon: Zap,
                title: 'Token-Gated Voting',
                description: 'Community-driven voting system. 10 CLRO tokens = 1 vote with spam prevention.',
                color: '#3b82f6',
                gradient: 'from-blue-500/10 to-blue-600/5'
              },
              {
                icon: Award,
                title: 'Transparency Scoring',
                description: 'Automated scoring algorithm based on multiple factors for fair evaluation.',
                color: '#3b82f6',
                gradient: 'from-blue-500/10 to-blue-600/5'
              },
              {
                icon: Sparkles,
                title: 'Badge System',
                description: 'Earn badges based on your transparency score. Diamond, Platinum, Gold, and more.',
                color: '#3b82f6',
                gradient: 'from-blue-500/10 to-blue-600/5'
              },
              {
                icon: Lock,
                title: 'Secure & Trusted',
                description: 'Built on Solana blockchain with security best practices and audit-ready architecture.',
                color: '#3b82f6',
                gradient: 'from-blue-500/10 to-blue-600/5'
              }
            ].map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                <div className="h-full bg-white border border-[#e5e7eb] rounded-2xl p-6 hover:border-[#3b82f6]/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  {/* Icon */}
                  <div className="relative z-10 mb-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#eff6ff] border border-[#3b82f6]/20 group-hover:bg-[#dbeafe] group-hover:border-[#3b82f6]/40 transition-all duration-300">
                      <card.icon className="w-7 h-7" style={{ color: card.color }} />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-[#0f172a] mb-2 group-hover:text-[#2563eb] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-[#64748b] text-sm leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#3b82f6]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-[#e5e7eb] relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-white to-[#f8fafc]">
        {/* Rich background layers - stronger */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#eff6ff]/80 via-[#eff6ff]/50 to-[#eff6ff]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff]/40 via-transparent to-[#eff6ff]/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.15),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(59,130,246,0.15),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_70%)]"></div>
        
        {/* Large depth blobs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#2b76f0]/12 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#2b76f0]/12 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
        
        {/* Pattern overlay - stronger */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(43, 118, 240, 0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(43, 118, 240, 0.15) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
        
        {/* Professional border accents */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent"></div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { label: 'Projects Verified', value: '100%', desc: 'On-chain verification', icon: CheckCircle2 },
              { label: 'Documents Uploaded', value: '∞', desc: 'Unlimited transparency', icon: FileText },
              { label: 'Vote Ratio', value: '1:1', desc: 'Token-gated voting', icon: Zap },
              { label: 'Transparency Score', value: '0-100', desc: 'Automated scoring', icon: Award }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                className="text-center group"
              >
                <motion.div 
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#eff6ff] border-2 border-[#2b76f0]/20 mb-4 group-hover:border-[#2b76f0] transition shadow-sm group-hover:shadow-md"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <stat.icon className="w-8 h-8 text-[#2b76f0]" />
                </motion.div>
                <div className="text-4xl md:text-5xl font-black mb-2 text-[#0f172a]">{stat.value}</div>
                <div className="text-sm font-semibold text-[#475569] mb-1">{stat.label}</div>
                <div className="text-xs text-[#64748b]">{stat.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative bg-gradient-to-b from-white via-[#fafafa] to-white">
        {/* Rich background accents - stronger */}
        <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-[#eff6ff]/60 via-[#eff6ff]/40 to-transparent"></div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#eff6ff]/60 via-[#eff6ff]/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff]/20 via-transparent to-[#eff6ff]/20"></div>
        
        {/* Circular gradient overlays - larger and stronger */}
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-[#2b76f0]/10 rounded-full blur-[120px] -translate-x-1/2"></div>
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-[#2b76f0]/10 rounded-full blur-[120px] translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#2b76f0]/8 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Additional radial gradients */}
        <div className="absolute top-0 left-1/2 w-[400px] h-[400px] bg-[#2b76f0]/6 rounded-full blur-[80px] -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-1/2 w-[400px] h-[400px] bg-[#2b76f0]/6 rounded-full blur-[80px] translate-x-1/2"></div>
        
        {/* Pattern - stronger */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(rgba(43, 118, 240, 0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(43, 118, 240, 0.15) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Diagonal pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `repeating-linear-gradient(
            135deg,
            transparent,
            transparent 20px,
            rgba(43, 118, 240, 0.05) 20px,
            rgba(43, 118, 240, 0.05) 40px
          )`
        }}></div>
        
        <div className="container mx-auto px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.6, type: "spring" }}
            className="mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-display mb-4 tracking-tight text-[#0f172a]">
              Features
            </h2>
            <p className="text-xl text-[#64748b]">Built for transparency and trust</p>
          </motion.div>

          <div className="space-y-32">
            {[
              {
                number: '01',
                title: 'Ownership Verification',
                description: 'On-chain verification using token burn. Burn 500 CLRO tokens with a unique verification code to prove you own the project wallet. Fully automated and trustless.',
                icon: Lock,
                color: '#3b82f6',
                features: ['On-chain verification', 'Unique verification codes', 'Automated process']
              },
              {
                number: '02',
                title: 'Transparency Profiles',
                description: 'Upload whitepapers, roadmaps, tokenomics, audits, and financial documents. Everything in one centralized location for maximum transparency and easy access.',
                icon: FileText,
                color: '#3b82f6',
                features: ['Document management', 'Hash verification', 'Multiple document types']
              },
              {
                number: '03',
                title: 'Token-Gated Voting',
                description: '10 CLRO tokens = 1 vote. Votes burn tokens, preventing spam and ensuring meaningful community engagement. Community-driven scoring ensures fair evaluation.',
                icon: Zap,
                color: '#3b82f6',
                features: ['Token burning', 'Spam prevention', 'Community-driven']
              },
              {
                number: '04',
                title: 'Transparency Score',
                description: 'Automated scoring algorithm based on votes (25%), documentation quality (50%), project updates (15%), and on-chain activity (10%). Real-time updates.',
                icon: Award,
                color: '#3b82f6',
                features: ['Multi-factor scoring', 'Real-time updates', 'Badge system']
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 80, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ 
                  duration: 0.8,
                  type: "spring",
                  stiffness: 80,
                  damping: 20,
                  delay: index * 0.1
                }}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center`}
              >
                <div className="flex-1 relative">
                  <div className="flex items-baseline gap-6 mb-8 relative z-10">
                    <span className="text-7xl md:text-8xl font-black text-[#f1f5f9]">{feature.number}</span>
                    <div className="relative">
                      <h3 className="text-4xl md:text-5xl font-display mb-4 tracking-tight text-[#0f172a]">
                        <RandomizedText text={feature.title} />
                      </h3>
                      <p className="text-lg text-[#475569] leading-relaxed max-w-xl">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {feature.features.map((feat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: false, margin: "-50px" }}
                        transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg cursor-default shadow-sm hover:shadow-md hover:border-[#2b76f0]/30 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" style={{ color: feature.color }} />
                        <span className="text-sm text-[#475569] font-medium">{feat}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <motion.div 
                  className="flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: false, margin: "-50px" }}
                  transition={{ 
                    delay: 0.2,
                    type: "spring",
                    stiffness: 150,
                    damping: 15
                  }}
                  whileHover={{ rotate: 5, scale: 1.05 }}
                >
                  <div 
                    className="w-40 h-40 rounded-2xl flex items-center justify-center border-2 border-[#2b76f0]/20 bg-[#eff6ff] shadow-lg relative overflow-hidden"
                    style={{ 
                      boxShadow: `0 10px 30px -10px ${feature.color}30`
                    }}
                  >
                    {/* Inner highlight */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent"></div>
                    <feature.icon className="w-20 h-20 relative z-10" style={{ color: feature.color }} />
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section className="py-32 border-y border-[#e5e7eb] bg-gradient-to-b from-[#f8fafc] via-white to-[#f8fafc] relative">
        {/* Background layers - stronger */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff]/50 via-[#eff6ff]/20 to-[#eff6ff]/50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#eff6ff]/30 via-transparent to-[#eff6ff]/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#3b82f6]/10 via-[#3b82f6]/3 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.08),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.08),transparent_60%)]"></div>
        
        {/* Large depth blobs */}
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[#2b76f0]/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-1/2 right-1/4 w-[500px] h-[500px] bg-[#2b76f0]/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
        
        {/* Pattern overlay - stronger */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(43, 118, 240, 0.08) 2px,
            rgba(43, 118, 240, 0.08) 4px
          )`
        }}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(43, 118, 240, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(43, 118, 240, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Professional border accents */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent"></div>
        
        <div className="container mx-auto px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-display mb-4 tracking-tight text-[#0f172a]">
              How It Works
            </h2>
            <p className="text-xl text-[#64748b]">Three steps to transparency</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">
              {[
                {
                  step: '1',
                  title: 'Verify Ownership',
                  description: 'Connect your wallet and burn 500 CLRO tokens with a verification code to prove ownership on-chain. Burning tokens adds economic commitment.',
                  icon: Shield
                },
                {
                  step: '2',
                  title: 'Upload Documents',
                  description: 'Add your whitepaper, roadmap, tokenomics, audits, and other transparency materials.',
                  icon: FileText
                },
                {
                  step: '3',
                  title: 'Get Voted & Scored',
                  description: 'Receive community votes and earn a transparency score based on documentation and activity.',
                  icon: TrendingUp
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: false, margin: "-50px" }}
                  transition={{ 
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  className="flex items-start gap-8"
                >
                  <motion.div 
                    className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-[#2b76f0]/30 relative overflow-hidden"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring" }}
                  >
                    {/* Inner highlight */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                    <span className="relative z-10">{item.step}</span>
                  </motion.div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-4 mb-3">
                      <item.icon className="w-6 h-6 text-[#2b76f0]" />
                      <h3 className="text-2xl font-bold text-[#0f172a]">{item.title}</h3>
                    </div>
                    <p className="text-[#475569] leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-b from-white via-[#fafafa] to-white relative">
        {/* Background depth - stronger */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3b82f6]/15 via-[#3b82f6]/5 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff]/40 via-transparent to-[#eff6ff]/40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#eff6ff]/20 via-transparent to-[#eff6ff]/20"></div>
        
        {/* Subtle animated gradient background */}
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe, #eff6ff)',
            backgroundSize: '300% 300%',
          }}
        ></motion.div>
        
        {/* Single subtle pulsing blob */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-[#2b76f0]/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        ></motion.div>
        
        {/* Security-themed icons for CTA - balanced */}
        <motion.div
          className="absolute top-1/4 left-1/3 z-[3]"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 4, -4, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Shield className="w-8 h-8 text-[#2b76f0]/50 drop-shadow-sm" />
        </motion.div>
        
        <motion.div
          className="absolute bottom-1/4 right-1/3 z-[3]"
          animate={{
            y: [0, 15, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        >
          <CheckCircle2 className="w-7 h-7 text-[#2b76f0]/50 drop-shadow-sm" />
        </motion.div>
        
        {/* Pattern overlays */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(rgba(43, 118, 240, 0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(43, 118, 240, 0.15) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 15px,
            rgba(43, 118, 240, 0.05) 15px,
            rgba(43, 118, 240, 0.05) 30px
          )`
        }}></div>
        <div className="container mx-auto px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              stiffness: 80
            }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-5xl md:text-6xl font-display mb-6 tracking-tight text-[#0f172a]">
              Ready to build trust?
            </h2>
            <p className="text-xl text-[#64748b] mb-12">
              Verify your project and start building transparency today.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 px-10 py-5 bg-[#2b76f0] hover:bg-[#2563eb] text-white rounded-lg font-semibold text-lg transition-all shadow-md shadow-[#2b76f0]/25 hover:shadow-lg"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
