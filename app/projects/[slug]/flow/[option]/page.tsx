import { promises as fs } from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeftIcon } from '@primer/octicons-react';
import { prisma } from '@/lib/db';
import {
  FLOW_EVENTS,
  ATTACK_BOARD,
  PHASES,
  ATTACK_LIFELINES,
  TASKS,
  TAGS,
  type FlowEvent,
} from '@/lib/mock/ipi-flow-data';
import {
  TimelineSection,
  BoardSection,
  PhaseSection,
  LifelineSection,
  TaskGroupSection,
  TagFilterSection,
} from '@/components/flow/sections';
import { TaskKanbanLive } from '@/components/flow/TaskKanbanLive';
import { buildLiveTasks, type EventLink, type EventComment } from '@/components/flow/task-kanban-helpers';
import type { TaskBucket } from '@/lib/mock/ipi-flow-data';

type OptionKey = 'a' | 'd' | 'e' | 'g' | 'h' | 'i' | 'j';

const OPTION_META: Record<OptionKey, { label: string; title: string; blurb: string }> = {
  a: { label: 'Option A', title: 'Timeline + 카드',          blurb: '시간순 progress 카드. 가장 단순. git progress 파일을 그대로 흐름으로 보여줌.' },
  d: { label: 'Option D', title: 'Status board (Kanban)',     blurb: 'Designed/Running/Done/Deprecated 4 컬럼. 지금 무엇이 살아있나 즉답.' },
  e: { label: 'Option E', title: 'Phase 그룹 (챕터)',         blurb: '긴 타임라인을 연구 라운드별로 묶음. 각 phase 마다 outcome + 안의 progress.' },
  g: { label: 'Option G', title: 'Per-attack lifeline (일생)', blurb: '공격 1개 = 가로 1줄. 디자인 → 첫 결과 → 마지막 상태까지의 마커.' },
  h: { label: 'Option H', title: 'Task 그룹 (단기/중기/장기)', blurb: "'무엇을 위해' 한 일인지로 묶음. 각 task 의 goal + 그 task 에 기여한 events." },
  i: { label: 'Option I', title: 'Tag filter (toggle)',       blurb: '위에서 태그 chip 클릭 → 아래 timeline 이 그 태그로 필터. tagging 방식.' },
  j: { label: 'Option J', title: 'Task Kanban (New! 배지)',   blurb: '단기/중기/장기 3 컬럼 Kanban. 각 task = 카드, 최근 활동 있으면 우상단 New! 배지. 카드 클릭 → 아래 timeline 필터.' },
};

const VALID_OPTIONS: OptionKey[] = ['a', 'd', 'e', 'g', 'h', 'i', 'j'];

function isOption(s: string): s is OptionKey {
  return (VALID_OPTIONS as readonly string[]).includes(s);
}

const PROGRESS_ROOT = '/home/dami/wj/Research/StealthyIPIAttack/progress/ys';

async function enrichWithSource(events: FlowEvent[]): Promise<FlowEvent[]> {
  return Promise.all(
    events.map(async e => {
      try {
        const content = await fs.readFile(path.join(PROGRESS_ROOT, e.source), 'utf8');
        return { ...e, sourceContent: content };
      } catch {
        return e;
      }
    }),
  );
}

export default async function FlowOptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; option: string }>;
  searchParams: Promise<{ tag?: string; task?: string; addTask?: string; editTask?: string; editEvent?: string; edit?: string }>;
}) {
  const { slug, option } = await params;
  const sp = await searchParams;

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) notFound();
  if (slug !== 'ipi-attack') notFound();
  if (!isOption(option)) notFound();

  const meta = OPTION_META[option];

  // Options that render the timeline (TimelineCard) need source content for the
  // expandable "원본 progress.md 보기" detail. Phase E doesn't render timeline cards
  // but uses other event metadata, so it doesn't need enrichment.
  const needsSource = option === 'a' || option === 'i' || option === 'j';
  const events = needsSource ? await enrichWithSource(FLOW_EVENTS) : FLOW_EVENTS;

  let body;
  switch (option) {
    case 'a': body = <TimelineSection events={events} />;                                            break;
    case 'd': body = <BoardSection cards={ATTACK_BOARD} />;                                          break;
    case 'e': body = <PhaseSection phases={PHASES} events={events} />;                              break;
    case 'g': body = <LifelineSection lifelines={ATTACK_LIFELINES} />;                              break;
    case 'h': body = <TaskGroupSection tasks={TASKS} events={events} />;                            break;
    case 'i': body = <TagFilterSection slug={slug} tags={TAGS} events={events} selectedTagId={sp.tag} />; break;
    case 'j': {
      const [rawTasks, rawLinks, rawEvents, rawComments] = await Promise.all([
        prisma.todoItem.findMany({
          where: { projectSlug: slug },
          orderBy: [{ bucket: 'asc' }, { position: 'asc' }],
          select: { id: true, bucket: true, text: true, goal: true, group: true, subtasks: true, status: true },
        }),
        prisma.flowEventTaskLink.findMany({
          where: { projectSlug: slug },
          select: { id: true, flowEventId: true, todoId: true, source: true },
        }),
        prisma.flowEvent.findMany({
          where: { projectSlug: slug },
          orderBy: [{ date: 'desc' }, { position: 'desc' }],
        }),
        prisma.flowEventComment.findMany({
          where: { flowEvent: { projectSlug: slug } },
          orderBy: { createdAt: 'asc' },
        }),
      ]);
      const commentsByEventId: Record<number, EventComment[]> = {};
      for (const c of rawComments) {
        if (!commentsByEventId[c.flowEventId]) commentsByEventId[c.flowEventId] = [];
        commentsByEventId[c.flowEventId].push(c);
      }
      const links: EventLink[] = rawLinks;
      // Build FlowEvent[] from DB rows (parse JSON fields). Enrich with sourceContent.
      const dbEvents: FlowEvent[] = rawEvents.map(r => ({
        id: r.id,
        date: r.date,
        source: r.source,
        title: r.title,
        summary: r.summary,
        tone: r.tone as FlowEvent['tone'],
        bullets: r.bullets ? JSON.parse(r.bullets) : undefined,
        numbers: r.numbers ? JSON.parse(r.numbers) : undefined,
        tags: r.tags ? JSON.parse(r.tags) : undefined,
      }));
      const enrichedEvents = await enrichWithSource(dbEvents);
      const eventIdBySource: Record<string, number> = {};
      for (const r of rawEvents) eventIdBySource[r.source] = r.id;
      const liveTasks = buildLiveTasks(rawTasks, links, enrichedEvents);
      const selectedTaskId = sp.task ? Number(sp.task) : undefined;
      const addTaskBucket = (sp.addTask === 'short' || sp.addTask === 'mid' || sp.addTask === 'long')
        ? (sp.addTask as TaskBucket) : undefined;
      const editTaskId = sp.editTask ? Number(sp.editTask) : undefined;
      const editEventId = sp.editEvent ? Number(sp.editEvent) : undefined;
      const editMode = sp.edit === '1' || Boolean(addTaskBucket) || Boolean(editTaskId) || Boolean(editEventId);
      body = (
        <TaskKanbanLive
          slug={slug}
          tasks={liveTasks}
          links={links}
          events={enrichedEvents}
          eventIdBySource={eventIdBySource}
          commentsByEventId={commentsByEventId}
          selectedTaskId={Number.isFinite(selectedTaskId) ? selectedTaskId : undefined}
          addTaskBucket={addTaskBucket}
          editTaskId={Number.isFinite(editTaskId) ? editTaskId : undefined}
          editEventId={Number.isFinite(editEventId) ? editEventId : undefined}
          editMode={editMode}
        />
      );
      break;
    }
  }

  // Prev/next navigation among options.
  const idx = VALID_OPTIONS.indexOf(option);
  const prev = idx > 0 ? VALID_OPTIONS[idx - 1] : null;
  const next = idx < VALID_OPTIONS.length - 1 ? VALID_OPTIONS[idx + 1] : null;

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      <Link
        href={`/projects/${slug}/flow`}
        className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-accent-fg"
      >
        <ChevronLeftIcon size={14} /> Flow 후보 목록으로
      </Link>

      <header>
        <div className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold">{meta.label}</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">{meta.title}</h1>
        <p className="text-sm text-fg-muted mt-2 leading-relaxed max-w-2xl">{meta.blurb}</p>
      </header>

      <div className="pt-2">{body}</div>

      <nav className="flex items-center justify-between pt-8 mt-8 border-t border-border-muted text-sm">
        {prev ? (
          <Link href={`/projects/${slug}/flow/${prev}`} className="text-fg-muted hover:text-accent-fg">
            ← {OPTION_META[prev].label}: {OPTION_META[prev].title}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/projects/${slug}/flow/${next}`} className="text-fg-muted hover:text-accent-fg ml-auto text-right">
            {OPTION_META[next].label}: {OPTION_META[next].title} →
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}
