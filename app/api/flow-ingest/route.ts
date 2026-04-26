// V2 ingest endpoint: spawns Claude Code CLI in headless mode to run the
// labhub-flow-ingest skill. Uses the dami user's Max plan login (no metered
// API cost). Sync — blocks until claude exits, then returns stdout/stderr.

import { spawn } from 'node:child_process';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Allow up to 5 minutes for ingest of multiple progress files.
export const maxDuration = 300;

const REPO_CWD = '/home/dami/wj/research_dashboard';
const CLAUDE_BIN = '/home/dami/.local/bin/claude';

export async function POST(req: Request) {
  let slug: string | undefined;
  try {
    const body = await req.json();
    slug = typeof body?.slug === 'string' ? body.slug : undefined;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'slug required' }, { status: 400 });
  }
  // Whitelist a-z, 0-9, hyphen — basic sanity for shell safety
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: 'invalid slug format' }, { status: 400 });
  }

  const prompt =
    `${slug} 프로젝트의 progress 들을 LabHub 에 ingest 해줘. ` +
    `labhub-flow-ingest skill 사용. 이미 처리된 source 는 skip. ` +
    `각 progress 마다 활동이 여러 개면 분할 (events 2-3개), 1개면 그대로. ` +
    `매 apply 후 결과 한 줄로 요약. 마지막에 처리한 progress 개수 + 새로 만든 task/event 수 출력.`;

  // Snapshot DB counts BEFORE the spawn so we can compute deltas after.
  const beforeEvents = await prisma.flowEvent.count({ where: { projectSlug: slug } });
  const beforeTasks = await prisma.todoItem.count({ where: { projectSlug: slug } });
  const beforeWiki = await prisma.wikiEntity.count({ where: { projectSlug: slug } });

  return await new Promise<Response>(resolve => {
    const startedAt = Date.now();
    const proc = spawn(
      CLAUDE_BIN,
      ['--print', '--dangerously-skip-permissions', prompt],
      {
        cwd: REPO_CWD,
        env: { ...process.env, HOME: '/home/dami' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d: Buffer) => {
      stdout += d.toString('utf8');
    });
    proc.stderr.on('data', (d: Buffer) => {
      stderr += d.toString('utf8');
    });
    proc.on('error', err => {
      resolve(NextResponse.json({
        ok: false,
        error: `failed to spawn claude: ${err.message}`,
        durationMs: Date.now() - startedAt,
      }, { status: 500 }));
    });
    proc.on('close', async code => {
      // Snapshot AFTER and compute deltas.
      const afterEvents = await prisma.flowEvent.count({ where: { projectSlug: slug } });
      const afterTasks = await prisma.todoItem.count({ where: { projectSlug: slug } });
      const afterWiki = await prisma.wikiEntity.count({ where: { projectSlug: slug } });
      resolve(NextResponse.json({
        ok: code === 0,
        code,
        delta: {
          events: afterEvents - beforeEvents,
          tasks: afterTasks - beforeTasks,
          wiki:  afterWiki  - beforeWiki,
        },
        before: { events: beforeEvents, tasks: beforeTasks, wiki: beforeWiki },
        after:  { events: afterEvents,  tasks: afterTasks,  wiki: afterWiki  },
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
      }));
    });
  });
}
