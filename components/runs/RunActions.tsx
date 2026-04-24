'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PencilIcon, TrashIcon } from '@primer/octicons-react';
import { deleteRunAction } from '@/lib/actions/runs';
import { SlideOver } from '@/components/ui/slide-over';
import { RunEditForm } from './RunEditForm';
import type { ExperimentRun } from '@/lib/types';

export function RunActions({
  run,
  projectSlug,
}: {
  run: ExperimentRun;
  projectSlug: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    startTransition(async () => {
      await deleteRunAction(run.id);
    });
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit run"
        className="inline-flex items-center gap-1 px-2 h-7 border border-border-default rounded-md bg-canvas-subtle hover:bg-canvas-inset"
      >
        <PencilIcon size={14} /> Edit
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className={`inline-flex items-center gap-1 px-2 h-7 border rounded-md transition-colors disabled:opacity-50 ${
          confirming
            ? 'border-danger-emphasis bg-danger-emphasis text-white hover:bg-danger-fg'
            : 'border-border-default bg-canvas-subtle hover:bg-canvas-inset'
        }`}
      >
        <TrashIcon size={14} /> {confirming ? 'Click again to confirm' : 'Delete'}
      </button>

      <SlideOver
        open={editing}
        onOpenChange={o => !o && setEditing(false)}
        title="Edit run"
        widthClass="max-w-2xl"
      >
        {editing && (
          <RunEditForm
            run={run}
            projectSlug={projectSlug}
            onSuccess={() => {
              setEditing(false);
              router.refresh();
            }}
            onCancel={() => setEditing(false)}
          />
        )}
      </SlideOver>
    </div>
  );
}
