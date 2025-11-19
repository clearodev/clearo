import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';

const WalletProvider = dynamic(() => import('@/components/WalletProvider').then(mod => ({ default: mod.WalletProvider })), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Clearo - Transparency Platform',
  description: 'A platform where projects prove ownership, publish transparency materials, and receive community votes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}

