import { loadProject } from '@/lib/mock/loaders';
import {
  getEntriesByProject,
  getMilestonesByProject,
  getTodosByProject,
  getPapersByProject,
  getRunsByProject,
} from '@/lib/queries';
import { KpiBar } from '@/components/journal/KpiBar';
import { TimelinePanel } from '@/components/journal/TimelinePanel';
import { TodosPanel } from '@/components/journal/TodosPanel';
import { JournalView } from '@/components/journal/JournalView';
import { MarkdownBody } from '@/components/md/MarkdownBody';

export default async function ProjectOverview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug, project } = await loadProject(params);

  const [entries, milestones, todos, papers, runs] = await Promise.all([
    getEntriesByProject(slug),
    getMilestonesByProject(slug),
    getTodosByProject(slug),
    getPapersByProject(slug),
    getRunsByProject(slug),
  ]);

  const papersCount = papers.length;
  const runsCount = runs.length;
  const meetingsCount = entries.filter(e => e.type === 'meeting').length;
  // Prefer the explicit project.targetVenue if set; else fall back to the
  // first paper's venue for backwards compatibility with projects that
  // haven't set one yet.
  const targetVenue = project.targetVenue ?? papers.find(p => p.venue)?.venue ?? '—';

  return (
    <div className="space-y-6">
      <KpiBar
        stats={[
          { label: 'papers', value: papersCount, tone: 'accent' },
          { label: 'experiments', value: runsCount, tone: 'success' },
          { label: 'meetings', value: meetingsCount, tone: 'attention' },
          { label: 'target', value: targetVenue, tone: 'done' },
        ]}
      />

      {project.readmeMarkdown ? (
        <section className="bg-white border border-border-default rounded-md p-6">
          <MarkdownBody source={project.readmeMarkdown} />
        </section>
      ) : null}

      <TimelinePanel milestones={milestones} projectSlug={slug} />
      <TodosPanel todos={todos} projectSlug={slug} />
      <JournalView entries={entries} projectSlug={slug} />
    </div>
  );
}
