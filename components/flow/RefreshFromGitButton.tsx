'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SyncIcon } from '@primer/octicons-react';
import { cn } from '@/lib/cn';

export function RefreshFromGitButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    durationMs?: number;
    delta?: { events: number; tasks: number; wiki: number };
    stdout?: string;
    stderr?: string;
    error?: string;
  } | null>(null);
  const [showLog, setShowLog] = useState(false);

  const isLoading = running || pending;

  async function onClick() {
    setRunning(true);
    setResult(null);
    try {
      const r = await fetch('/api/flow-ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await r.json();
      setResult(data);
      if (data.ok) {
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : 'fetch failed' });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border transition-colors',
          isLoading
            ? 'bg-canvas-subtle border-border-default text-fg-muted cursor-wait'
            : 'bg-white border-border-default text-fg-muted hover:border-accent-fg',
        )}
        aria-label="git 에서 새 progress 가져와 ingest"
      >
        <SyncIcon size={12} className={isLoading ? 'animate-spin' : ''} />
        {isLoading ? '진행 중…' : 'Refresh from git'}
      </button>
      {result && (() => {
        const d = result.delta;
        const noChange = result.ok && d && d.events === 0 && d.tasks === 0 && d.wiki === 0;
        const headline = !result.ok
          ? '✗ 동기화 실패'
          : noChange
          ? '✓ 동기화할 거 없음'
          : '✓ 동기화 완료';
        return (
          <div
            className={cn(
              'text-[10px] mt-0.5 px-2 py-1 rounded border max-w-[400px]',
              !result.ok
                ? 'bg-danger-subtle border-danger-subtle text-danger-fg'
                : noChange
                ? 'bg-canvas-subtle border-border-default text-fg-muted'
                : 'bg-success-subtle border-success-subtle text-success-fg',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">{headline}</span>
              {result.ok && d && !noChange && (
                <span>
                  {d.events > 0 && `events +${d.events}`}
                  {d.events > 0 && d.tasks > 0 && ' · '}
                  {d.tasks > 0 && `tasks +${d.tasks}`}
                  {(d.events > 0 || d.tasks > 0) && d.wiki > 0 && ' · '}
                  {d.wiki > 0 && `wiki +${d.wiki}`}
                </span>
              )}
              {result.durationMs !== undefined && (
                <span className="opacity-70 ml-auto">{(result.durationMs / 1000).toFixed(1)}s</span>
              )}
            </div>
            {(result.stdout || result.stderr || result.error) && (
              <button
                type="button"
                onClick={() => setShowLog(s => !s)}
                className="text-[9px] mt-0.5 underline hover:no-underline opacity-70"
              >
                {showLog ? '로그 숨김' : '로그 보기'}
              </button>
            )}
            {showLog && (
              <pre className="mt-1 max-h-[300px] overflow-y-auto whitespace-pre-wrap text-[9px] font-mono opacity-80">
                {result.stdout && `--- stdout ---\n${result.stdout}\n`}
                {result.stderr && `--- stderr ---\n${result.stderr}\n`}
                {result.error && `--- error ---\n${result.error}\n`}
              </pre>
            )}
          </div>
        );
      })()}
    </div>
  );
}
