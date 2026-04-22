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
        <TopNav />
        <main className="max-w-screen-2xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
