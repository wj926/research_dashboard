import type { Metadata } from 'next';
import { TopNav } from '@/components/nav/TopNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'LabHub',
  description: 'Research lab dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas-subtle">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-accent-fg focus:text-white focus:px-3 focus:py-1.5 focus:rounded-md"
        >
          Skip to content
        </a>
        <TopNav />
        <main id="main-content" className="max-w-screen-2xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
