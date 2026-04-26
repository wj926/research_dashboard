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

type ApplyPayload = {
  projectSlug: string;
  event: {
    date: string;
    source: string;
    title: string;
    summary: string;
    tone: 'milestone' | 'pivot' | 'result' | 'incident' | 'design';
    bullets?: string[];
    numbers?: { label: string; value: string }[];
    tags?: string[];
  };
  taskIds?: number[];          // links to TodoItem.id
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

const ALLOWED_TONES = new Set(['milestone', 'pivot', 'result', 'incident', 'design']);

async function cmdApply(stdinJson: string) {
  let payload: ApplyPayload;
  try {
    payload = JSON.parse(stdinJson);
  } catch {
    throw new Error(`apply: stdin is not valid JSON`);
  }

  const { projectSlug, event, taskIds = [], overwrite = false } = payload;
  if (!projectSlug) throw new Error('apply: projectSlug required');
  if (!event?.source) throw new Error('apply: event.source required');
  if (!event.title) throw new Error('apply: event.title required');
  if (!ALLOWED_TONES.has(event.tone)) {
    throw new Error(`apply: invalid tone "${event.tone}". Must be one of: ${[...ALLOWED_TONES].join(', ')}`);
  }

  const prisma = newPrisma();
  try {
    // Validate project + tasks exist
    const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
    if (!project) throw new Error(`apply: project not found: ${projectSlug}`);
    if (taskIds.length > 0) {
      const found = await prisma.todoItem.findMany({
        where: { projectSlug, id: { in: taskIds } },
        select: { id: true },
      });
      const foundIds = new Set(found.map(t => t.id));
      const missing = taskIds.filter(id => !foundIds.has(id));
      if (missing.length > 0) {
        throw new Error(`apply: taskIds not found in this project: ${missing.join(', ')}`);
      }
    }

    // Determine next position
    const max = await prisma.flowEvent.findFirst({
      where: { projectSlug },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const nextPos = (max?.position ?? -1) + 1;

    // Upsert event
    const existing = await prisma.flowEvent.findUnique({
      where: { projectSlug_source: { projectSlug, source: event.source } },
    });
    if (existing && !overwrite) {
      throw new Error(`apply: event already exists for source "${event.source}". Pass overwrite:true to replace.`);
    }

    let saved;
    if (existing) {
      saved = await prisma.flowEvent.update({
        where: { id: existing.id },
        data: {
          date: event.date,
          title: event.title,
          summary: event.summary,
          tone: event.tone,
          bullets: event.bullets ? JSON.stringify(event.bullets) : null,
          numbers: event.numbers ? JSON.stringify(event.numbers) : null,
          tags: event.tags ? JSON.stringify(event.tags) : null,
        },
      });
      // Wipe existing LLM-source links so we re-apply (preserve manual)
      await prisma.flowEventTaskLink.deleteMany({
        where: { projectSlug, eventSource: event.source, source: 'llm' },
      });
    } else {
      saved = await prisma.flowEvent.create({
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
    }

    // Insert task links (LLM source)
    let linkCount = 0;
    for (const tid of taskIds) {
      try {
        await prisma.flowEventTaskLink.create({
          data: { projectSlug, eventSource: event.source, todoId: tid, source: 'llm' },
        });
        linkCount += 1;
      } catch {
        // unique constraint hit (already linked from manual side) — fine
      }
    }

    console.log(JSON.stringify({
      ok: true,
      eventId: saved.id,
      mode: existing ? 'updated' : 'created',
      taskLinks: linkCount,
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
