import Link from 'next/link';

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen bg-canvas-subtle flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-border-default rounded-md p-8 space-y-4">
        <h1 className="text-lg font-semibold">Sign-in error</h1>
        <p className="text-sm text-fg-muted">
          {error === 'AccessDenied'
            ? 'Your GitHub account is not registered in this lab. Contact an admin to be added.'
            : `An error occurred: ${error ?? 'unknown'}`}
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center px-3 h-8 rounded-md bg-fg-default text-white text-sm"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
