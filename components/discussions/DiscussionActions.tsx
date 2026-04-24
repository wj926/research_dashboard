'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon, PencilIcon } from '@primer/octicons-react';
import { deleteDiscussionAction } from '@/lib/actions/discussions';
import { SlideOver } from '@/components/ui/slide-over';
import { DiscussionForm } from './DiscussionForm';
import type { Discussion, Project } from '@/lib/types';

export function DiscussionActions({
  discussion,
  projects,
}: {
  discussion: Discussion;
  projects: Project[];
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
      await deleteDiscussionAction(discussion.id);
    });
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 px-2 h-7 border border-border-default rounded-md bg-canvas-subtle hover:bg-canvas-inset text-xs"
      >
        <PencilIcon size={14} /> Edit
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className={`inline-flex items-center gap-1 px-2 h-7 border rounded-md text-xs transition-colors disabled:opacity-50 ${
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
        title="Edit discussion"
        widthClass="max-w-2xl"
      >
        {editing && (
          <DiscussionForm
            mode="edit"
            initial={discussion}
            projects={projects}
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
