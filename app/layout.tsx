import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import { TopNav } from '@/components/nav/TopNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'LabHub2 (wj)',
  description: 'Research lab dashboard — damilab fork',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In Playwright smoke mode we force-render the chrome so existing specs
  // (which never sign in) continue to find TopNav search/nav elements.
  const isTest = process.env.PLAYWRIGHT_TEST === 'true';
  const session = isTest ? null : await auth();
  const showChrome = isTest || !!session;
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas-subtle">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-accent-fg focus:text-white focus:px-3 focus:py-1.5 focus:rounded-md"
        >
          Skip to content
        </a>
        <SessionProvider session={session}>
          {showChrome ? <TopNav /> : null}
          <main
            id="main-content"
            className={showChrome ? 'max-w-screen-2xl mx-auto px-4 py-6' : ''}
          >
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
