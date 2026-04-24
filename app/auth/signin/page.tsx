import { signIn } from '@/auth';
import { MarkGithubIcon } from '@primer/octicons-react';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? '/';

  return (
    <main className="min-h-screen bg-canvas-subtle flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-border-default rounded-md p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-xl font-bold mb-2">
            <MarkGithubIcon size={22} />
            <span>LabHub</span>
          </div>
          <p className="text-sm text-fg-muted">Internal research dashboard</p>
        </div>

        {params.error && (
          <div
            role="alert"
            className="bg-danger-subtle border border-danger-subtle rounded-md p-3 text-sm text-danger-fg"
          >
            {params.error === 'AccessDenied'
              ? 'Your GitHub account is not registered in this lab. Contact an admin to be added.'
              : `Sign-in failed: ${params.error}`}
          </div>
        )}

        <form
          action={async () => {
            'use server';
            await signIn('github', { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#24292f] text-white text-sm font-medium hover:bg-[#1f2328]"
          >
            <MarkGithubIcon size={16} /> Sign in with GitHub
          </button>
        </form>

        <p className="text-xs text-fg-muted text-center">
          Sign in with any GitHub account. If you&apos;re new here, a member
          profile will be created automatically — you can edit your name,
          role, and avatar afterwards.
        </p>
      </div>
    </main>
  );
}
