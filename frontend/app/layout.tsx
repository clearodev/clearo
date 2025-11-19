import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';

const WalletAuthProvider = dynamic(() => import('@/contexts/WalletAuthContext').then(mod => ({ default: mod.WalletAuthProvider })), {
  ssr: false,
});

const WalletProvider = dynamic(() => import('@/components/WalletProvider').then(mod => ({ default: mod.WalletProvider })), {
  ssr: false,
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Clearo - Transparency Platform',
  description: 'A platform where projects prove ownership, publish transparency materials, and receive community votes',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://clearo.dev'),
  openGraph: {
    title: 'Clearo - Transparency Platform',
    description: 'A platform where projects prove ownership, publish transparency materials, and receive community votes',
    url: 'https://clearo.dev',
    siteName: 'Clearo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clearo - Transparency Platform',
    description: 'A platform where projects prove ownership, publish transparency materials, and receive community votes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <WalletProvider>
          <WalletAuthProvider>
            {children}
          </WalletAuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}

