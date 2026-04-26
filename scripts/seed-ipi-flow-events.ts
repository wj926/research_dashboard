// One-shot mockup seeder for FlowEvent table from FLOW_EVENTS mock.
// Idempotent: deletes existing rows first.
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';
import { FLOW_EVENTS } from '../lib/mock/ipi-flow-data';

const PROJECT_SLUG = 'ipi-attack';

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: 'file:./prod.db' });
  const prisma = new PrismaClient({ adapter });

  await prisma.flowEvent.deleteMany({ where: { projectSlug: PROJECT_SLUG } });

  let pos = 0;
  for (const e of FLOW_EVENTS) {
    await prisma.flowEvent.create({
      data: {
        projectSlug: PROJECT_SLUG,
        date: e.date,
        source: e.source,
        title: e.title,
        summary: e.summary,
        tone: e.tone,
        bullets: e.bullets ? JSON.stringify(e.bullets) : null,
        numbers: e.numbers ? JSON.stringify(e.numbers) : null,
        tags: e.tags ? JSON.stringify(e.tags) : null,
        position: pos++,
      },
    });
  }

  const c = await prisma.flowEvent.count({ where: { projectSlug: PROJECT_SLUG } });
  console.log(`Seeded ${c} flow events for project=${PROJECT_SLUG}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
