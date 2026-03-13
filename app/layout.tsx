import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Rent Revision Pro',
  description: 'AI-Powered Property & Tenant Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
      </head>
      <body className="font-sans antialiased bg-slate-950 text-slate-50" suppressHydrationWarning>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
