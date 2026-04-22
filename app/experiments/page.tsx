import { RunRow } from '@/components/runs/RunRow';
import { experiments } from '@/lib/mock';

export default function ExperimentsIndex() {
  const now = Date.now();
  const runs = [...experiments].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Experiments</h1>
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span>Filters (placeholder):</span>
        <span className="px-2 py-1 bg-white border border-border-default rounded-md">Status</span>
        <span className="px-2 py-1 bg-white border border-border-default rounded-md">Project</span>
        <span className="px-2 py-1 bg-white border border-border-default rounded-md">Actor</span>
      </div>
      <ul className="bg-white border border-border-default rounded-md">
        {runs.map(r => <RunRow key={r.id} run={r} now={now} />)}
      </ul>
    </div>
  );
}
