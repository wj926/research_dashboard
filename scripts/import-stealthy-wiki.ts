// One-shot mockup importer: reads /home/dami/wj/Research/StealthyIPIAttack/wiki/
// and seeds WikiType + WikiEntity rows under projectSlug='ipi-attack'.
// Throwaway during brainstorming. Idempotent (deletes & re-inserts).
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const WIKI_ROOT = '/home/dami/wj/Research/StealthyIPIAttack/wiki';
const PROJECT_SLUG = 'ipi-attack';

type Frontmatter = {
  name?: string;
  type?: string;
  status?: string;
  last_updated?: string;
};

function parseFrontmatter(src: string): { fm: Frontmatter; body: string } {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: src };
  const fm: Frontmatter = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) (fm as Record<string, string>)[kv[1]] = kv[2].trim();
  }
  return { fm, body: m[2] };
}

function extractSummary(body: string): string {
  // Pull the content under "## Summary" (until the next ## or eof).
  const m = body.match(/##\s+Summary\s*\n([\s\S]*?)(?:\n##\s|$)/);
  if (m) return m[1].trim();
  // fallback: first non-empty non-heading paragraph
  for (const para of body.split(/\n\n+/)) {
    const t = para.trim();
    if (t && !t.startsWith('#')) return t;
  }
  return '';
}

const TYPE_DIRS: { dir: string; key: string; label: string; position: number }[] = [
  { dir: 'attacks',   key: 'attack',   label: 'Attacks',   position: 0 },
  { dir: 'defenses',  key: 'defense',  label: 'Defenses',  position: 1 },
  { dir: 'concepts',  key: 'concept',  label: 'Concepts',  position: 2 },
  { dir: 'findings',  key: 'finding',  label: 'Findings',  position: 3 },
];

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: 'file:./prod.db' });
  const prisma = new PrismaClient({ adapter });

  // Ensure project has localPath set so future ingest knows where to look.
  await prisma.project.update({
    where: { slug: PROJECT_SLUG },
    data: { localPath: '/home/dami/wj/Research/StealthyIPIAttack' },
  });

  // Upsert wiki types (idempotent).
  for (const t of TYPE_DIRS) {
    await prisma.wikiType.upsert({
      where: { projectSlug_key: { projectSlug: PROJECT_SLUG, key: t.key } },
      create: {
        projectSlug: PROJECT_SLUG,
        key: t.key,
        label: t.label,
        position: t.position,
      },
      update: { label: t.label, position: t.position },
    });
  }

  // Walk each type directory; upsert with content compare so lastSyncedAt
  // only advances when the entity actually changed (or is new).
  const now = new Date();
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  const seenIds = new Set<string>();

  for (const t of TYPE_DIRS) {
    const dir = path.join(WIKI_ROOT, t.dir);
    let files: string[] = [];
    try {
      files = (await fs.readdir(dir)).filter(f => f.endsWith('.md'));
    } catch {
      continue;
    }
    for (const f of files) {
      const full = path.join(dir, f);
      const src = await fs.readFile(full, 'utf8');
      const { fm, body } = parseFrontmatter(src);
      const id = (fm.name ?? f.replace(/\.md$/, '')).trim();
      const name = fm.name ?? id;
      const status = fm.status ?? 'active';
      const summary = extractSummary(body);
      const trimmedBody = body.trim();
      const sourceRel = path.relative('/home/dami/wj/Research/StealthyIPIAttack', full);
      seenIds.add(id);

      const existing = await prisma.wikiEntity.findUnique({
        where: { projectSlug_id: { projectSlug: PROJECT_SLUG, id } },
      });

      if (!existing) {
        await prisma.wikiEntity.create({
          data: {
            projectSlug: PROJECT_SLUG,
            id,
            type: t.key,
            name,
            status,
            summaryMarkdown: summary,
            bodyMarkdown: trimmedBody,
            sourceFiles: JSON.stringify([sourceRel]),
            lastSyncedAt: now,
          },
        });
        created += 1;
      } else if (
        existing.bodyMarkdown === trimmedBody &&
        existing.summaryMarkdown === summary &&
        existing.status === status &&
        existing.name === name &&
        existing.type === t.key
      ) {
        // No content change — preserve lastSyncedAt.
        unchanged += 1;
      } else {
        await prisma.wikiEntity.update({
          where: { projectSlug_id: { projectSlug: PROJECT_SLUG, id } },
          data: {
            type: t.key,
            name,
            status,
            summaryMarkdown: summary,
            bodyMarkdown: trimmedBody,
            sourceFiles: JSON.stringify([sourceRel]),
            lastSyncedAt: now,
          },
        });
        updated += 1;
      }
    }
  }

  // Delete entities present in DB but no longer in git.
  const orphans = await prisma.wikiEntity.findMany({
    where: { projectSlug: PROJECT_SLUG, id: { notIn: [...seenIds] } },
    select: { id: true },
  });
  if (orphans.length > 0) {
    await prisma.wikiEntity.deleteMany({
      where: { projectSlug: PROJECT_SLUG, id: { in: orphans.map(o => o.id) } },
    });
  }

  console.log(
    `Wiki sync (project=${PROJECT_SLUG}): created=${created} updated=${updated} unchanged=${unchanged} deleted=${orphans.length}`,
  );
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
