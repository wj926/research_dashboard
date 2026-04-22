import Link from 'next/link';
import { ArrowLeftIcon } from '@primer/octicons-react';
import { createProject } from '@/lib/actions/projects';

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-accent-fg hover:underline mb-4">
        <ArrowLeftIcon size={14} /> Back to projects
      </Link>
      <h1 className="text-lg font-semibold mb-4">New project</h1>
      <form action={createProject} className="space-y-4 bg-white border border-border-default rounded-md p-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g., reasoning-bench-v3"
            className="w-full border border-border-default rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-emphasis"
          />
          <p className="text-xs text-fg-muted mt-1">Slug will be derived from the name (lowercase, hyphenated).</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            placeholder="One-line summary of the project"
            className="w-full border border-border-default rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-emphasis resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="tags">Tags</label>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="LLM, benchmark, reasoning (comma-separated)"
            className="w-full border border-border-default rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-emphasis"
          />
        </div>
        <div className="flex items-center gap-2">
          <input id="pinned" name="pinned" type="checkbox" className="accent-accent-emphasis" />
          <label htmlFor="pinned" className="text-sm">Pin on dashboard</label>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="px-3 h-8 rounded-md bg-success-emphasis text-white text-sm font-medium hover:bg-success-fg disabled:opacity-50"
          >
            Create project
          </button>
          <Link
            href="/projects"
            className="px-3 h-8 inline-flex items-center rounded-md border border-border-default text-sm hover:bg-canvas-subtle"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
