'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

const CLRO_TOKEN_MINT = process.env.NEXT_PUBLIC_CLRO_TOKEN_MINT || '11111111111111111111111111111111';

export function Footer() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CLRO_TOKEN_MINT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buyUrl = CLRO_TOKEN_MINT !== '11111111111111111111111111111111' 
    ? `https://jup.ag/swap?inputMint=SOL&outputMint=${CLRO_TOKEN_MINT}`
    : 'https://jup.ag';

  return (
    <footer className="relative z-10 border-t border-[#e5e7eb] py-16 bg-white">
      <div className="container mx-auto px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img src="/icon.svg" alt="Clearo" className="w-8 h-8" />
              <div className="text-xl font-display tracking-tight bg-gradient-to-r from-[#2b76f0] to-[#2b76f0] bg-clip-text text-transparent">
                Clearo
              </div>
            </div>
            <p className="text-sm text-[#64748b]">Built for transparency</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Navigation</h3>
            <div className="flex flex-col gap-2 text-sm text-[#64748b]">
              <Link href="/projects" className="hover:text-[#2b76f0] transition">Projects</Link>
              <Link href="/verify" className="hover:text-[#2b76f0] transition">Verify</Link>
              <Link href="/whitepaper" className="hover:text-[#2b76f0] transition">Whitepaper</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Contact</h3>
            <div className="flex flex-col gap-2 text-sm text-[#64748b]">
              <a href="https://clearo.dev" target="_blank" rel="noopener noreferrer" className="hover:text-[#2b76f0] transition">clearo.dev</a>
              <a href="https://x.com/useClearo" target="_blank" rel="noopener noreferrer" className="hover:text-[#2b76f0] transition">X: @useClearo</a>
              <a href="mailto:hi@clearo.dev" className="hover:text-[#2b76f0] transition">hi@clearo.dev</a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">CLRO Token</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#64748b] mb-1">Contract Address</div>
                  <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg px-3 py-2">
                    <code 
                      className="text-xs font-mono text-[#1a1a1a] truncate flex-1"
                      title={CLRO_TOKEN_MINT !== '11111111111111111111111111111111' ? CLRO_TOKEN_MINT : undefined}
                    >
                      {CLRO_TOKEN_MINT !== '11111111111111111111111111111111' 
                        ? `${CLRO_TOKEN_MINT.slice(0, 4)}...${CLRO_TOKEN_MINT.slice(-4)}`
                        : 'Not configured'}
                    </code>
                    {CLRO_TOKEN_MINT !== '11111111111111111111111111111111' && (
                      <button
                        onClick={handleCopy}
                        className="flex-shrink-0 p-1 hover:bg-[#e5e7eb] rounded transition"
                        title="Copy full address"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#64748b]" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {CLRO_TOKEN_MINT !== '11111111111111111111111111111111' && (
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2b76f0] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-lg transition shadow-md shadow-[#2b76f0]/25 hover:shadow-lg"
                >
                  Buy CLRO
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-[#e5e7eb] text-center text-sm text-[#94a3b8]">
          © 2025 Clearo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

