import Link from 'next/link';
import { ArrowLeftIcon } from '@primer/octicons-react';
import { createDiscussion } from '@/lib/actions/discussions';
import {
  DISCUSSION_CATEGORY_LABELS,
  DISCUSSION_CATEGORY_ICONS,
  DISCUSSION_CATEGORY_ORDER,
} from '@/lib/labels';

export default function NewDiscussionPage() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/discussions"
        className="inline-flex items-center gap-1 text-sm text-accent-fg hover:underline mb-4"
      >
        <ArrowLeftIcon size={14} /> Back to discussions
      </Link>
      <h1 className="text-lg font-semibold mb-4">New discussion</h1>
      <form action={createDiscussion} className="space-y-4 bg-white border border-border-default rounded-md p-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            required
            defaultValue="qa"
            className="w-full border border-border-default rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-emphasis"
          >
            {DISCUSSION_CATEGORY_ORDER.map(cat => (
              <option key={cat} value={cat}>
                {DISCUSSION_CATEGORY_ICONS[cat]} {DISCUSSION_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="What's on your mind?"
            className="w-full border border-border-default rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-emphasis"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="body">
            Body <span className="text-fg-muted font-normal">(Markdown)</span>
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={8}
            placeholder="Write in Markdown…"
            className="w-full border border-border-default rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-emphasis resize-y"
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="px-3 h-8 rounded-md bg-success-emphasis text-white text-sm font-medium hover:bg-success-fg"
          >
            Create discussion
          </button>
          <Link
            href="/discussions"
            className="px-3 h-8 inline-flex items-center rounded-md border border-border-default text-sm hover:bg-canvas-subtle"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
