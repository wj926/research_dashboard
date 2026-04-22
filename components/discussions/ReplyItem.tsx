'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { TrashIcon } from '@primer/octicons-react';
import { deleteReplyAction } from '@/lib/actions/discussions';
import { Avatar } from '@/components/people/Avatar';
import { MarkdownBody } from '@/components/md/MarkdownBody';

export function ReplyItem({
  discussionId,
  replyId,
  authorLogin,
  authorName,
  createdAt,
  bodyMarkdown,
}: {
  discussionId: string;
  replyId: string;
  authorLogin: string;
  authorName: string;
  createdAt: string;
  bodyMarkdown: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      await deleteReplyAction(discussionId, replyId);
    });
  };

  return (
    <div className="bg-white border border-border-default rounded-md p-4 group">
      <div className="text-xs text-fg-muted mb-2 flex items-center gap-2">
        <Avatar login={authorLogin} size={16} /> <b>{authorName}</b> ·{' '}
        {new Date(createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className={`ml-auto transition-opacity inline-flex items-center gap-1 text-xs disabled:opacity-50 ${
            confirming
              ? 'opacity-100 text-danger-fg font-semibold'
              : 'opacity-0 group-hover:opacity-100 text-fg-muted hover:text-danger-fg'
          }`}
          aria-label={confirming ? 'Click again to confirm delete' : 'Delete reply'}
        >
          <TrashIcon size={12} /> {confirming ? 'Click again to confirm' : ''}
        </button>
      </div>
      <MarkdownBody source={bodyMarkdown} />
    </div>
  );
}
