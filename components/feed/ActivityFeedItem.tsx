import Link from 'next/link';
import type { ActivityEvent, PaperEventAction } from '@/lib/types';
import { Avatar } from '@/components/people/Avatar';
import { LabelChip } from '@/components/badges/LabelChip';
import type { EventContext } from '@/lib/queries/resolve';
import { relTime } from '@/lib/time';

const toneByType = {
  paper: 'accent',
  experiment: 'attention',
  release: 'success',
  discussion: 'done',
  project: 'neutral',
} as const;

function paperVerb(action: PaperEventAction, version?: number): string {
  switch (action) {
    case 'uploaded_draft': return `uploaded draft v${version ?? '?'} of`;
    case 'published':      return 'published';
    case 'created':        return 'created';
  }
}

function renderBody(e: ActivityEvent, ctx: EventContext) {
  const actor = ctx.members.get(e.actorLogin)?.displayName ?? e.actorLogin;
  const proj = e.projectSlug ? ctx.projects.get(e.projectSlug) : undefined;
  const projLink = proj ? (
    <Link href={`/projects/${proj.slug}`} className="text-accent-fg hover:underline">{proj.name}</Link>
  ) : null;

  switch (e.type) {
    case 'paper': {
      const paper = ctx.papers.get(e.payload.paperId);
      return <span><b>{actor}</b> {paperVerb(e.payload.action, e.payload.version)} <i>&ldquo;{paper?.title ?? 'a paper'}&rdquo;</i>{projLink && <> in {projLink}</>}</span>;
    }
    case 'experiment': {
      const run = ctx.runs.get(e.payload.runId);
      const verb = e.payload.action === 'started' ? 'started' : e.payload.action === 'failed' ? 'failed' : e.payload.action === 'cancelled' ? 'cancelled' : 'finished';
      return <span><b>{actor}</b> {verb} run <code className="bg-canvas-inset px-1 rounded">{run?.name ?? e.payload.runId}</code>{projLink && <> in {projLink}</>}</span>;
    }
    case 'release': {
      const rel = ctx.releases.get(e.payload.releaseId);
      return <span><b>{actor}</b> released <i>{rel?.name} {rel?.version}</i>{projLink && <> in {projLink}</>}</span>;
    }
    case 'discussion': {
      const d = ctx.discussions.get(e.payload.discussionId);
      return <span><b>{actor}</b> opened <Link href={`/discussions/${d?.id}`} className="text-accent-fg hover:underline">{d?.title ?? 'a discussion'}</Link></span>;
    }
    case 'project':
      return <span><b>{actor}</b> updated {projLink ?? 'a project'}</span>;
    default: {
      e satisfies never;
      return null;
    }
  }
}

export function ActivityFeedItem({ event, now, ctx }: { event: ActivityEvent; now: number; ctx: EventContext }) {
  return (
    <li className="flex items-start gap-3 py-3 border-b border-border-muted last:border-0">
      <Avatar login={event.actorLogin} size={24} />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm">
          <LabelChip tone={toneByType[event.type]}>{event.type}</LabelChip>
          <span>{renderBody(event, ctx)}</span>
        </div>
        <div className="text-xs text-fg-muted mt-1">{relTime(event.createdAt, now)}</div>
      </div>
    </li>
  );
}
