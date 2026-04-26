// One-shot mockup seeder for Flow J: writes TASKS mock data to TodoItem table
// and event-task mappings to FlowEventTaskLink table for project=ipi-attack.
// Idempotent: deletes existing rows first.
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';
import { TASKS } from '../lib/mock/ipi-flow-data';

const PROJECT_SLUG = 'ipi-attack';

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: 'file:./prod.db' });
  const prisma = new PrismaClient({ adapter });

  // Wipe existing for this project
  await prisma.flowEventTaskLink.deleteMany({ where: { projectSlug: PROJECT_SLUG } });
  await prisma.todoItem.deleteMany({ where: { projectSlug: PROJECT_SLUG } });

  let pos = 0;
  let totalLinks = 0;
  for (const t of TASKS) {
    const todo = await prisma.todoItem.create({
      data: {
        projectSlug: PROJECT_SLUG,
        bucket: t.bucket,
        text: t.title,
        position: pos++,
        done: t.status === 'done',
        goal: t.goal,
        subtasks: t.subtasks ? JSON.stringify(t.subtasks) : null,
        status: t.status,
      },
    });

    // Links are no longer seeded here — they need real FlowEvent.id which
    // doesn't exist at task-seed time. Use ingest skill to create both.
    void t.eventSources; // silence unused warning
    void totalLinks;
  }

  const taskCount = await prisma.todoItem.count({ where: { projectSlug: PROJECT_SLUG } });
  console.log(`Seeded ${taskCount} tasks + ${totalLinks} event links into project=${PROJECT_SLUG}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
