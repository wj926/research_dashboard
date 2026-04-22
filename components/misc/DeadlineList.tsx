import type { Venue } from '@/lib/types';
import { daysUntil } from '@/lib/time';

export function DeadlineList({ venues, now, title = 'Upcoming' }: { venues: Venue[]; now: number; title?: string }) {
  return (
    <section className="bg-white border border-border-default rounded-md p-4">
      <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">{title}</h3>
      <ul className="space-y-2">
        {venues.map(v => (
          <li key={v.id} className="text-sm flex items-baseline justify-between gap-3">
            <span>
              <span className="font-medium">{v.name}</span>
              <span className="text-fg-muted"> · {v.kind.replace('_', ' ')}</span>
            </span>
            <span className="text-xs text-fg-muted whitespace-nowrap">in {daysUntil(v.deadline, now)}d</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
