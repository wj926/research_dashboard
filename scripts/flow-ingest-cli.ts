// CLI for labhub-flow-ingest skill — performs all DB I/O so the skill
// itself only does LLM extraction. Subcommands:
//
//   get-project --slug <slug>
//     → JSON: { project, tasks, wikiTypes, ingestedSources }
//
//   list-new-progress --slug <slug> [--force]
//     → JSON: { progressRoot, files: [{ path, source, ingested }] }
//
//   apply  (reads JSON from stdin)
//     → applies one progress file's extracted data to DB
//
// All output is JSON on stdout. Errors → stderr, exit 1.

import 'dotenv/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';

// Convention for auto-deriving localPath from githubRepo. Hardcoded for now;
// in production this would come from project config or env.
const RESEARCH_ROOT = '/home/dami/wj/Research';

function deriveLocalPath(githubRepo: string): string {
  // githubRepo format: "owner/repo" → use the repo part as the directory name.
  const repo = githubRepo.includes('/') ? githubRepo.split('/').pop()! : githubRepo;
  return path.join(RESEARCH_ROOT, repo);
}

async function pathExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

async function isGitCheckout(p: string): Promise<boolean> {
  try {
    const s = await fs.stat(path.join(p, '.git'));
    return s.isDirectory();
  } catch { return false; }
}

/**
 * Resolve a project's local git path. Priority:
 *   1. Project.localPath if set + valid git checkout.
 *   2. Derived from githubRepo. If exists + git checkout → use.
 *      If doesn't exist → auto-clone from GitHub.
 *
 * Logs progress to stderr. Returns absolute path.
 */
async function resolveLocalPath(project: { githubRepo: string | null; localPath: string | null }): Promise<string> {
  // Case 1: explicit localPath
  if (project.localPath) {
    if (await isGitCheckout(project.localPath)) return project.localPath;
    throw new Error(`Project.localPath "${project.localPath}" exists but is not a git checkout.`);
  }

  // Case 2: derive from githubRepo
  if (!project.githubRepo) {
    throw new Error('project has neither localPath nor githubRepo. Set githubRepo (e.g. "owner/repo") to enable auto-derive.');
  }
  const derived = deriveLocalPath(project.githubRepo);

  if (await pathExists(derived)) {
    if (await isGitCheckout(derived)) return derived;
    throw new Error(
      `derived path "${derived}" exists but is not a git checkout. ` +
      `Move/remove it, or set Project.localPath to a different location.`,
    );
  }

  // Auto-clone
  process.stderr.write(`📥 cloning https://github.com/${project.githubRepo}.git → ${derived}\n`);
  // Make parent dir if needed
  await fs.mkdir(path.dirname(derived), { recursive: true });
  const r = spawnSync('git', ['clone', '--depth', '1', `https://github.com/${project.githubRepo}.git`, derived], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  if (r.status !== 0) {
    throw new Error(`git clone failed (exit ${r.status}). For private repos, set up auth or set localPath manually.`);
  }
  // Unshallow so subsequent pulls work cleanly
  spawnSync('git', ['-C', derived, 'fetch', '--unshallow'], { stdio: ['ignore', 'pipe', 'pipe'] });
  return derived;
}

type EventTone = 'milestone' | 'pivot' | 'result' | 'incident' | 'design' | 'deprecated';

type TaskRef =
  | { kind: 'existing'; id: number }                              // link to known TodoItem
  | { kind: 'new'; bucket: 'short' | 'mid' | 'long'; title: string; goal?: string; group?: string; subtasks?: string[]; status?: 'pending' | 'in_progress' | 'done' }
  | null;                                                         // uncategorized (rare; LLM should almost always pick or create)

type ApplyPayload = {
  projectSlug: string;
  event: {
    date: string;
    source: string;
    title: string;
    summary: string;
    tone: EventTone;
    bullets?: string[];
    numbers?: { label: string; value: string }[];
    tags?: string[];
  };
  task: TaskRef;
  overwrite?: boolean;         // re-apply even if event already exists
};

function parseArgs(argv: string[]): { sub: string; flags: Record<string, string | boolean> } {
  const [, , sub, ...rest] = argv;
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = rest[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    }
  }
  return { sub: sub ?? '', flags };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

function newPrisma() {
  const adapter = new PrismaBetterSqlite3({ url: 'file:./prod.db' });
  return new PrismaClient({ adapter });
}

// =====================================================================
// get-project
// =====================================================================

async function cmdGetProject(slug: string) {
  const prisma = newPrisma();
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) throw new Error(`project not found: ${slug}`);
  if (!project.githubRepo) {
    throw new Error(
      `project "${slug}" has no githubRepo set (e.g. "owner/repo"). ` +
      `Set Project.githubRepo before ingest — it's the canonical "what this project follows".`,
    );
  }
  // Resolve effective local path (auto-clone from githubRepo if needed)
  const effectiveLocalPath = await resolveLocalPath(project);

  const [tasks, wikiTypes, ingested] = await Promise.all([
    prisma.todoItem.findMany({
      where: { projectSlug: slug },
      orderBy: [{ bucket: 'asc' }, { position: 'asc' }],
      select: { id: true, bucket: true, text: true, goal: true, subtasks: true, status: true },
    }),
    prisma.wikiType.findMany({
      where: { projectSlug: slug },
      orderBy: { position: 'asc' },
      select: { key: true, label: true, description: true },
    }),
    prisma.flowEvent.findMany({
      where: { projectSlug: slug },
      select: { source: true },
    }),
  ]);

  await prisma.$disconnect();
  console.log(JSON.stringify({
    project: {
      slug: project.slug,
      name: project.name,
      githubRepo: project.githubRepo,
      localPath: effectiveLocalPath,
      localPathSource: project.localPath ? 'explicit' : 'derived',
    },
    tasks: tasks.map(t => ({
      id: t.id,
      bucket: t.bucket,
      title: t.text,
      goal: t.goal,
      subtasks: t.subtasks ? JSON.parse(t.subtasks) : [],
      status: t.status,
    })),
    wikiTypes,
    ingestedSources: ingested.map(e => e.source),
  }, null, 2));
}

// =====================================================================
// list-new-progress
// =====================================================================

async function cmdListNewProgress(slug: string, force: boolean) {
  const prisma = newPrisma();
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) throw new Error(`project not found: ${slug}`);
  if (!project.githubRepo) {
    throw new Error(`project "${slug}" has no githubRepo set; ingest needs it`);
  }
  const effectiveLocalPath = await resolveLocalPath(project);

  const progressRoot = path.join(effectiveLocalPath, 'progress');
  const ingested = new Set<string>(
    force ? [] : (await prisma.flowEvent.findMany({
      where: { projectSlug: slug },
      select: { source: true },
    })).map(e => e.source),
  );

  const files: { path: string; source: string; ingested: boolean }[] = [];

  // Walk progress/<researcher>/progress_*.md
  let researcherDirs: string[] = [];
  try {
    researcherDirs = await fs.readdir(progressRoot);
  } catch {
    await prisma.$disconnect();
    console.log(JSON.stringify({ progressRoot, files: [] }, null, 2));
    return;
  }
  for (const d of researcherDirs) {
    const sub = path.join(progressRoot, d);
    const stat = await fs.stat(sub).catch(() => null);
    if (!stat?.isDirectory()) continue;
    const entries = await fs.readdir(sub);
    for (const f of entries) {
      if (!/^progress_.*\.md$/.test(f)) continue;
      files.push({
        path: path.join(sub, f),
        source: f,
        ingested: ingested.has(f),
      });
    }
  }

  files.sort((a, b) => a.source.localeCompare(b.source));
  await prisma.$disconnect();
  console.log(JSON.stringify({ progressRoot, files }, null, 2));
}

// =====================================================================
// apply
// =====================================================================

const ALLOWED_TONES = new Set(['milestone', 'pivot', 'result', 'incident', 'design', 'deprecated']);
const ALLOWED_BUCKETS = new Set(['short', 'mid', 'long']);
const ALLOWED_TASK_STATUSES = new Set(['pending', 'in_progress', 'done']);

async function cmdApply(stdinJson: string) {
  let payload: ApplyPayload;
  try {
    payload = JSON.parse(stdinJson);
  } catch {
    throw new Error(`apply: stdin is not valid JSON`);
  }

  const { projectSlug, event, task, overwrite = false } = payload;
  if (!projectSlug) throw new Error('apply: projectSlug required');
  if (!event?.source) throw new Error('apply: event.source required');
  if (!event.title) throw new Error('apply: event.title required');
  if (!ALLOWED_TONES.has(event.tone)) {
    throw new Error(`apply: invalid tone "${event.tone}". Must be one of: ${[...ALLOWED_TONES].join(', ')}`);
  }
  if (task !== null && task !== undefined) {
    if (task.kind === 'existing') {
      if (!Number.isFinite(task.id)) throw new Error('apply: task.id must be a number');
    } else if (task.kind === 'new') {
      if (!ALLOWED_BUCKETS.has(task.bucket)) {
        throw new Error(`apply: task.bucket must be one of: ${[...ALLOWED_BUCKETS].join(', ')}`);
      }
      if (!task.title) throw new Error('apply: task.title required for new task');
      if (task.status && !ALLOWED_TASK_STATUSES.has(task.status)) {
        throw new Error(`apply: task.status must be one of: ${[...ALLOWED_TASK_STATUSES].join(', ')}`);
      }
    } else {
      throw new Error('apply: task.kind must be "existing" or "new", or task = null');
    }
  }

  const prisma = newPrisma();
  try {
    // Validate project exists
    const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
    if (!project) throw new Error(`apply: project not found: ${projectSlug}`);

    // Resolve task to a single todoId (existing or newly-created)
    let resolvedTodoId: number | null = null;
    let createdTask = false;
    if (task && task.kind === 'existing') {
      const exists = await prisma.todoItem.findFirst({
        where: { projectSlug, id: task.id },
        select: { id: true },
      });
      if (!exists) throw new Error(`apply: task.id ${task.id} not found in project ${projectSlug}`);
      resolvedTodoId = task.id;
    } else if (task && task.kind === 'new') {
      const max = await prisma.todoItem.findFirst({
        where: { projectSlug, bucket: task.bucket },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      const created = await prisma.todoItem.create({
        data: {
          projectSlug,
          bucket: task.bucket,
          text: task.title,
          goal: task.goal ?? null,
          group: task.group ?? null,
          subtasks: task.subtasks && task.subtasks.length > 0 ? JSON.stringify(task.subtasks) : null,
          status: task.status ?? 'in_progress',
          done: task.status === 'done',
          position: (max?.position ?? -1) + 1,
        },
      });
      resolvedTodoId = created.id;
      createdTask = true;
    }

    // Optionally clear all existing events for this source (re-ingest mode).
    // If overwrite=true and there are events for this source, delete them all
    // first (and their LLM-source task links). Manual links survive on the
    // event cascade since FlowEventTaskLink.eventSource references the
    // string, not the event ID — but the next ingest will re-create them
    // from the LLM extraction.
    if (overwrite) {
      const existingForSource = await prisma.flowEvent.findMany({
        where: { projectSlug, source: event.source },
        select: { id: true },
      });
      if (existingForSource.length > 0) {
        // FlowEventTaskLink cascades on flowEvent delete (onDelete: Cascade)
        await prisma.flowEvent.deleteMany({
          where: { projectSlug, source: event.source },
        });
      }
    }

    // Determine next position (events are ordered globally for the project).
    const max = await prisma.flowEvent.findFirst({
      where: { projectSlug },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const nextPos = (max?.position ?? -1) + 1;

    const saved = await prisma.flowEvent.create({
      data: {
        projectSlug,
        date: event.date,
        source: event.source,
        title: event.title,
        summary: event.summary,
        tone: event.tone,
        bullets: event.bullets ? JSON.stringify(event.bullets) : null,
        numbers: event.numbers ? JSON.stringify(event.numbers) : null,
        tags: event.tags ? JSON.stringify(event.tags) : null,
        position: nextPos,
      },
    });

    // Insert single task link (LLM source) if a task was resolved
    let linkCreated = false;
    if (resolvedTodoId !== null) {
      try {
        await prisma.flowEventTaskLink.create({
          data: { projectSlug, flowEventId: saved.id, todoId: resolvedTodoId, source: 'llm' },
        });
        linkCreated = true;
      } catch {
        // unique constraint hit (already linked from manual side) — fine
      }
    }

    console.log(JSON.stringify({
      ok: true,
      eventId: saved.id,
      mode: 'created',
      taskId: resolvedTodoId,
      taskCreated: createdTask,
      linkCreated,
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

// =====================================================================
// dispatch
// =====================================================================

async function main() {
  const { sub, flags } = parseArgs(process.argv);
  switch (sub) {
    case 'get-project': {
      const slug = String(flags.slug ?? '');
      if (!slug) throw new Error('get-project: --slug required');
      await cmdGetProject(slug);
      return;
    }
    case 'list-new-progress': {
      const slug = String(flags.slug ?? '');
      if (!slug) throw new Error('list-new-progress: --slug required');
      await cmdListNewProgress(slug, Boolean(flags.force));
      return;
    }
    case 'apply': {
      const stdin = await readStdin();
      await cmdApply(stdin);
      return;
    }
    default:
      console.error('usage: flow-ingest-cli {get-project|list-new-progress|apply} [flags]');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
