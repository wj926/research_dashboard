'use client';

import { useRef } from 'react';
import { createReply } from '@/lib/actions/discussions';

export function ReplyForm({ discussionId }: { discussionId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    await createReply(discussionId, formData);
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="bg-white border border-border-default rounded-md p-4 space-y-3"
    >
      <label htmlFor="reply-body" className="block text-sm font-medium">Reply</label>
      <textarea
        id="reply-body"
        name="body"
        required
        rows={4}
        placeholder="Write your reply… (Markdown supported)"
        className="w-full border border-border-default rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-emphasis resize-y"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-3 h-8 rounded-md bg-success-emphasis text-white text-sm font-medium hover:bg-success-fg"
        >
          Post reply
        </button>
      </div>
    </form>
  );
}
