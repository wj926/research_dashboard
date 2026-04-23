// Auth pages inherit the root <html>/<body>/<SessionProvider> shell but render
// without the TopNav (the root layout already gates TopNav on session).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
