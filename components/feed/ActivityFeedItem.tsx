import Link from 'next/link';
import type { ActivityEvent } from '@/lib/types';
import { Avatar } from '@/components/people/Avatar';
import { LabelChip } from '@/components/badges/LabelChip';
import { getMemberByLogin, getProjectBySlug, getPaperById, getReleaseById, getRunById, getDiscussionById } from '@/lib/mock';

function relTime(iso: string, now = Date.now()) {
  const diffMin = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const toneByType = { paper: 'accent', experiment: 'attention', release: 'success', discussion: 'done', project: 'neutral' } as const;

function renderBody(e: ActivityEvent) {
  const actor = getMemberByLogin(e.actorLogin)?.displayName ?? e.actorLogin;
  const proj = e.projectSlug ? getProjectBySlug(e.projectSlug)?.name : undefined;
  const projLink = e.projectSlug ? (
    <Link href={`/projects/${e.projectSlug}`} className="text-accent-fg hover:underline">{proj}</Link>
  ) : null;

  switch (e.type) {
    case 'paper': {
      const paper = getPaperById(e.payload.paperId as string);
      const action = e.payload.action === 'uploaded_draft'
        ? `uploaded draft v${e.payload.version} of`
        : e.payload.action === 'published' ? 'published' : 'created';
      return <span><b>{actor}</b> {action} <i>"{paper?.title ?? 'a paper'}"</i> in {projLink}</span>;
    }
    case 'experiment': {
      const run = getRunById(e.payload.runId as string);
      const verb = e.payload.action === 'started' ? 'started' : e.payload.action === 'failed' ? 'failed' : 'finished';
      return <span><b>{actor}</b> {verb} run <code className="bg-canvas-inset px-1 rounded">{run?.name ?? e.payload.runId as string}</code> in {projLink}</span>;
    }
    case 'release': {
      const rel = getReleaseById(e.payload.releaseId as string);
      return <span><b>{actor}</b> released <i>{rel?.name} {rel?.version}</i> in {projLink}</span>;
    }
    case 'discussion': {
      const d = getDiscussionById(e.payload.discussionId as string);
      return <span><b>{actor}</b> opened <Link href={`/discussions/${d?.id}`} className="text-accent-fg hover:underline">{d?.title ?? 'a discussion'}</Link></span>;
    }
    case 'project':
      return <span><b>{actor}</b> updated {projLink}</span>;
  }
}

export function ActivityFeedItem({ event }: { event: ActivityEvent }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-muted last:border-0">
      <Avatar login={event.actorLogin} size={24} />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm">
          <LabelChip tone={toneByType[event.type]}>{event.type}</LabelChip>
          <span>{renderBody(event)}</span>
        </div>
        <div className="text-xs text-fg-muted mt-1">{relTime(event.createdAt)}</div>
      </div>
    </div>
  );
}
