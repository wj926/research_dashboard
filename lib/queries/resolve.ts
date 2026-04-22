import { prisma } from '@/lib/db';
import type {
  ActivityEvent,
  Member,
  Project,
  Paper,
  ExperimentRun,
  Release,
  Discussion,
  UserLogin,
  Slug,
} from '@/lib/types';

/**
 * Bulk-resolve context maps needed by ActivityFeedItem so that a client/child
 * component doesn't need to do N individual async lookups.
 */
export interface EventContext {
  members: Map<UserLogin, Member>;
  projects: Map<Slug, Project>;
  papers: Map<string, Paper>;
  runs: Map<string, ExperimentRun>;
  releases: Map<string, Release>;
  discussions: Map<string, Discussion>;
}

export async function resolveEventContext(events: ActivityEvent[]): Promise<EventContext> {
  const memberLogins = new Set<UserLogin>();
  const projectSlugs = new Set<Slug>();
  const paperIds = new Set<string>();
  const runIds = new Set<string>();
  const releaseIds = new Set<string>();
  const discussionIds = new Set<string>();

  for (const e of events) {
    memberLogins.add(e.actorLogin);
    if (e.projectSlug) projectSlugs.add(e.projectSlug);
    switch (e.type) {
      case 'paper':
        paperIds.add(e.payload.paperId);
        break;
      case 'experiment':
        runIds.add(e.payload.runId);
        break;
      case 'release':
        releaseIds.add(e.payload.releaseId);
        break;
      case 'discussion':
        discussionIds.add(e.payload.discussionId);
        break;
    }
  }

  const [memberRows, projectRows, paperRows, runRows, releaseRows, discussionRows] = await Promise.all([
    memberLogins.size
      ? prisma.member.findMany({ where: { login: { in: [...memberLogins] } } })
      : Promise.resolve([]),
    projectSlugs.size
      ? prisma.project.findMany({ where: { slug: { in: [...projectSlugs] } } })
      : Promise.resolve([]),
    paperIds.size
      ? prisma.paper.findMany({ where: { id: { in: [...paperIds] } } })
      : Promise.resolve([]),
    runIds.size
      ? prisma.experimentRun.findMany({ where: { id: { in: [...runIds] } } })
      : Promise.resolve([]),
    releaseIds.size
      ? prisma.release.findMany({ where: { id: { in: [...releaseIds] } } })
      : Promise.resolve([]),
    discussionIds.size
      ? prisma.discussion.findMany({ where: { id: { in: [...discussionIds] } } })
      : Promise.resolve([]),
  ]);

  const members = new Map<UserLogin, Member>();
  for (const m of memberRows) {
    members.set(m.login, {
      login: m.login,
      displayName: m.displayName,
      role: m.role as Member['role'],
      pinnedProjectSlugs: JSON.parse(m.pinnedProjectSlugs),
      ...(m.avatarUrl != null ? { avatarUrl: m.avatarUrl } : {}),
      ...(m.bio != null ? { bio: m.bio } : {}),
    });
  }

  const projects = new Map<Slug, Project>();
  for (const p of projectRows) {
    projects.set(p.slug, {
      slug: p.slug,
      name: p.name,
      description: p.description,
      tags: JSON.parse(p.tags),
      pinned: p.pinned,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      memberLogins: [],
      repos: [],
      paperIds: [],
      releaseIds: [],
    });
  }

  const papers = new Map<string, Paper>();
  for (const p of paperRows) {
    papers.set(p.id, {
      id: p.id,
      title: p.title,
      authorLogins: [],
      projectSlug: p.projectSlug,
      stage: p.stage as Paper['stage'],
      ...(p.venue != null ? { venue: p.venue } : {}),
      ...(p.deadline != null ? { deadline: p.deadline.toISOString() } : {}),
      ...(p.draftUrl != null ? { draftUrl: p.draftUrl } : {}),
      ...(p.pdfUrl != null ? { pdfUrl: p.pdfUrl } : {}),
    });
  }

  const runs = new Map<string, ExperimentRun>();
  for (const r of runRows) {
    runs.set(r.id, {
      id: r.id,
      name: r.name,
      projectSlug: r.projectSlug,
      status: r.status as ExperimentRun['status'],
      startedAt: r.startedAt.toISOString(),
      triggeredByLogin: r.triggeredByLogin,
      ...(r.durationSec != null ? { durationSec: r.durationSec } : {}),
      ...(r.summary != null ? { summary: r.summary } : {}),
      ...(r.stepsJson != null ? { stepsMock: JSON.parse(r.stepsJson) } : {}),
    });
  }

  const releases = new Map<string, Release>();
  for (const rel of releaseRows) {
    releases.set(rel.id, {
      id: rel.id,
      name: rel.name,
      kind: rel.kind as Release['kind'],
      projectSlug: rel.projectSlug,
      version: rel.version,
      publishedAt: rel.publishedAt.toISOString(),
      ...(rel.description != null ? { description: rel.description } : {}),
      ...(rel.downloadUrl != null ? { downloadUrl: rel.downloadUrl } : {}),
    });
  }

  const discussions = new Map<string, Discussion>();
  for (const d of discussionRows) {
    discussions.set(d.id, {
      id: d.id,
      category: d.category as Discussion['category'],
      title: d.title,
      authorLogin: d.authorLogin,
      createdAt: d.createdAt.toISOString(),
      lastActivityAt: d.lastActivityAt.toISOString(),
      replyCount: d.replyCount,
      bodyMarkdown: d.bodyMarkdown,
      replies: [],
    });
  }

  return { members, projects, papers, runs, releases, discussions };
}

/**
 * Bulk-resolve members + projects referenced by a list of runs. Used so RunRow
 * (a server component) doesn't need to fetch per-row.
 */
export interface RunContext {
  members: Map<UserLogin, Member>;
  projects: Map<Slug, Project>;
}

export async function resolveRunContext(runs: ExperimentRun[]): Promise<RunContext> {
  const memberLogins = new Set<UserLogin>(runs.map(r => r.triggeredByLogin));
  const projectSlugs = new Set<Slug>(runs.map(r => r.projectSlug));

  const [memberRows, projectRows] = await Promise.all([
    memberLogins.size
      ? prisma.member.findMany({ where: { login: { in: [...memberLogins] } } })
      : Promise.resolve([]),
    projectSlugs.size
      ? prisma.project.findMany({ where: { slug: { in: [...projectSlugs] } } })
      : Promise.resolve([]),
  ]);

  const members = new Map<UserLogin, Member>();
  for (const m of memberRows) {
    members.set(m.login, {
      login: m.login,
      displayName: m.displayName,
      role: m.role as Member['role'],
      pinnedProjectSlugs: JSON.parse(m.pinnedProjectSlugs),
      ...(m.avatarUrl != null ? { avatarUrl: m.avatarUrl } : {}),
      ...(m.bio != null ? { bio: m.bio } : {}),
    });
  }

  const projects = new Map<Slug, Project>();
  for (const p of projectRows) {
    projects.set(p.slug, {
      slug: p.slug,
      name: p.name,
      description: p.description,
      tags: JSON.parse(p.tags),
      pinned: p.pinned,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      memberLogins: [],
      repos: [],
      paperIds: [],
      releaseIds: [],
    });
  }

  return { members, projects };
}

/** Resolve a map of projectSlug -> project name for a list of papers. */
export async function resolvePaperProjects(papers: Paper[]): Promise<Map<Slug, Project>> {
  const slugs = new Set<Slug>(papers.map(p => p.projectSlug));
  if (slugs.size === 0) return new Map();
  const rows = await prisma.project.findMany({ where: { slug: { in: [...slugs] } } });
  const out = new Map<Slug, Project>();
  for (const p of rows) {
    out.set(p.slug, {
      slug: p.slug,
      name: p.name,
      description: p.description,
      tags: JSON.parse(p.tags),
      pinned: p.pinned,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      memberLogins: [],
      repos: [],
      paperIds: [],
      releaseIds: [],
    });
  }
  return out;
}
