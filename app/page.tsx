import { PlusIcon } from '@primer/octicons-react';
import Link from 'next/link';
import { ProjectCard } from '@/components/project/ProjectCard';
import { ActivityFeedItem } from '@/components/feed/ActivityFeedItem';
import { DeadlineList } from '@/components/misc/DeadlineList';
import { getPinnedProjects, getUpcomingVenues, getRecentEvents } from '@/lib/mock';

export default function Dashboard() {
  const pinned = getPinnedProjects();
  const venues = getUpcomingVenues().slice(0, 5);
  const events = getRecentEvents(12);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <h2 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-3">Pinned projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pinned.map(p => <ProjectCard key={p.slug} project={p} />)}
            <Link
              href="/projects"
              className="border border-dashed border-border-default rounded-md p-4 flex flex-col items-center justify-center text-fg-muted hover:border-accent-fg hover:text-accent-fg"
            >
              <PlusIcon size={20} />
              <span className="text-sm mt-1">New project</span>
            </Link>
          </div>
        </div>
        <DeadlineList venues={venues} />
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-3">Recent activity</h2>
        <div className="bg-white border border-border-default rounded-md px-4">
          {events.map(e => <ActivityFeedItem key={e.id} event={e} />)}
        </div>
      </section>
    </div>
  );
}
