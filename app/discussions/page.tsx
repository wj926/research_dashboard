import { DiscussionRow } from '@/components/discussions/DiscussionRow';
import { discussions } from '@/lib/mock';
import {
  DISCUSSION_CATEGORY_LABELS,
  DISCUSSION_CATEGORY_ICONS,
  DISCUSSION_CATEGORY_ORDER,
} from '@/lib/labels';

export default function DiscussionsIndex() {
  const now = Date.now();
  const sorted = [...discussions].sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <aside className="bg-white border border-border-default rounded-md p-3 h-fit">
        <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">Categories</h3>
        <ul className="space-y-1 text-sm">
          {DISCUSSION_CATEGORY_ORDER.map(id => {
            const count = discussions.filter(d => d.category === id).length;
            return (
              <li key={id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-canvas-subtle">
                <span>{DISCUSSION_CATEGORY_ICONS[id]} {DISCUSSION_CATEGORY_LABELS[id]}</span>
                <span className="text-xs text-fg-muted">{count}</span>
              </li>
            );
          })}
        </ul>
      </aside>
      <section>
        <h1 className="text-lg font-semibold mb-3">Discussions</h1>
        <ul className="bg-white border border-border-default rounded-md">
          {sorted.map(d => <DiscussionRow key={d.id} discussion={d} now={now} />)}
        </ul>
      </section>
    </div>
  );
}
