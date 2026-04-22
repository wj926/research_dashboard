import { RunRow } from '@/components/runs/RunRow';
import { EmptyState } from '@/components/misc/EmptyState';
import { getRunsByProject } from '@/lib/queries';
import { resolveRunContext } from '@/lib/queries/resolve';
import { loadProject } from '@/lib/mock/loaders';
import { requestNow } from '@/lib/time';

export default async function ProjectExperiments({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await loadProject(params);
  const now = requestNow();
  const runs = (await getRunsByProject(slug)).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  if (runs.length === 0) return <EmptyState title="No runs yet" />;
  const ctx = await resolveRunContext(runs);
  return (
    <ul className="bg-white border border-border-default rounded-md">
      {runs.map(r => <RunRow key={r.id} run={r} hideProject now={now} ctx={ctx} />)}
    </ul>
  );
}
