import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { DeadlineList } from '@/components/misc/DeadlineList';
import { getAllPapers, getUpcomingVenues } from '@/lib/queries';
import { resolvePaperProjects } from '@/lib/queries/resolve';
import { requestNow } from '@/lib/time';

export default async function PipelinePage() {
  const now = requestNow();
  const [papers, venues] = await Promise.all([
    getAllPapers(),
    getUpcomingVenues(new Date(now)),
  ]);
  const projectMap = await resolvePaperProjects(papers);
  const projectNames: Record<string, string> = {};
  for (const [slug, proj] of projectMap.entries()) projectNames[slug] = proj.name;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <div>
        <h1 className="text-lg font-semibold mb-4">Pipeline</h1>
        <KanbanBoard initial={papers} projectNames={projectNames} />
      </div>
      <div>
        <DeadlineList venues={venues} now={now} title="Venue deadlines" />
      </div>
    </div>
  );
}
