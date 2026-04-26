// "Live" version of Option J: tasks come from DB (TodoItem),
// event↔task mappings come from FlowEventTaskLink, and the user can
// create / edit / delete tasks and re-assign events.
//
// URL state controls open forms:
//   ?task=<id>            — filter timeline by task
//   ?addTask=<bucket>     — show "add task" form for a bucket
//   ?editTask=<id>        — show "edit task" form
//
// Server-rendered. Forms post to server actions in lib/actions/flow-tasks.ts.

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { LabelChip, type LabelTone } from '@/components/badges/LabelChip';
import { PencilIcon, PlusIcon, TrashIcon, XIcon } from '@primer/octicons-react';
import {
  type FlowEvent,
  type TaskBucket,
  type TaskStatus,
} from '@/lib/mock/ipi-flow-data';
import {
  TimelineCard,
  bucketLabel,
  taskStatusTone,
  taskStatusLabel,
  eventTone,
} from '@/components/flow/sections';
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  linkEventToTaskAction,
  unlinkEventFromTaskAction,
  updateFlowEventAction,
  deleteFlowEventAction,
} from '@/lib/actions/flow-tasks';

export type LiveTask = {
  id: number;
  bucket: TaskBucket;
  title: string;
  goal: string | null;
  subtasks: string[];          // parsed
  status: TaskStatus;
  isNew: boolean;              // computed (latest event date >= cutoff)
  latestDate: string;          // computed
  eventCount: number;          // computed
};

export type EventLink = {
  id: number;
  eventSource: string;
  todoId: number;
  source: string;              // 'llm' | 'manual'
};

const BUCKETS: TaskBucket[] = ['short', 'mid', 'long'];

function parseSubtasks(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.map(String);
  } catch {
    /* ignore */
  }
  return [];
}

const NEW_CUTOFF = '2026-04-25 00:00';

export function buildLiveTasks(
  rawTasks: { id: number; bucket: string; text: string; goal: string | null; subtasks: string | null; status: string }[],
  links: EventLink[],
  events: FlowEvent[],
): LiveTask[] {
  const linksByTask = new Map<number, string[]>();
  for (const l of links) {
    if (!linksByTask.has(l.todoId)) linksByTask.set(l.todoId, []);
    linksByTask.get(l.todoId)!.push(l.eventSource);
  }
  const eventByKey = new Map(events.map(e => [e.source, e]));

  return rawTasks.map(t => {
    const sources = linksByTask.get(t.id) ?? [];
    const taskEvents = sources.map(s => eventByKey.get(s)).filter(Boolean) as FlowEvent[];
    const latestDate = taskEvents.reduce<string>((a, e) => (e.date > a ? e.date : a), '');
    return {
      id: t.id,
      bucket: t.bucket as TaskBucket,
      title: t.text,
      goal: t.goal,
      subtasks: parseSubtasks(t.subtasks),
      status: (t.status as TaskStatus) ?? 'in_progress',
      isNew: latestDate > NEW_CUTOFF,
      latestDate,
      eventCount: taskEvents.length,
    };
  });
}

// =====================================================================
// Forms
// =====================================================================

function TaskFormFields({
  defaultTitle,
  defaultGoal,
  defaultSubtasks,
  defaultStatus,
  defaultBucket,
}: {
  defaultTitle?: string;
  defaultGoal?: string | null;
  defaultSubtasks?: string[];
  defaultStatus?: TaskStatus;
  defaultBucket?: TaskBucket;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">제목</label>
        <input
          name="title"
          required
          defaultValue={defaultTitle ?? ''}
          className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm"
          placeholder="예: 5종 ablation × MELON 105 sweep"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">Bucket</label>
          <select name="bucket" defaultValue={defaultBucket ?? 'short'} className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm">
            <option value="short">단기</option>
            <option value="mid">중기</option>
            <option value="long">장기</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">상태</label>
          <select name="status" defaultValue={defaultStatus ?? 'in_progress'} className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm">
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">Goal (1줄 설명, 선택)</label>
        <input
          name="goal"
          defaultValue={defaultGoal ?? ''}
          className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm"
          placeholder="이 task 의 목적 1줄"
        />
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">Subtasks (한 줄당 1개, 선택)</label>
        <textarea
          name="subtasks"
          rows={3}
          defaultValue={defaultSubtasks?.join('\n') ?? ''}
          className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm font-mono"
          placeholder="A: anti-MELON-token negation&#10;B: pure abstract gate"
        />
      </div>
    </div>
  );
}

function AddTaskForm({
  slug,
  bucket,
  onCancelHref,
}: {
  slug: string;
  bucket: TaskBucket;
  onCancelHref: string;
}) {
  return (
    <form action={createTaskAction} className="bg-white border-2 border-accent-fg rounded-md p-3 space-y-3">
      <input type="hidden" name="projectSlug" value={slug} />
      <input type="hidden" name="redirectTo" value={`/projects/${slug}/flow/j`} />
      <div className="text-[11px] uppercase tracking-wider text-accent-fg font-semibold">{bucketLabel(bucket)}에 task 추가</div>
      <TaskFormFields defaultBucket={bucket} />
      <div className="flex justify-end gap-2 pt-1">
        <Link href={onCancelHref} className="px-3 py-1 text-xs border border-border-default rounded hover:bg-canvas-subtle">취소</Link>
        <button type="submit" className="px-3 py-1 text-xs bg-accent-fg text-white rounded hover:opacity-90">추가</button>
      </div>
    </form>
  );
}

function EditTaskForm({
  slug,
  task,
  onCancelHref,
}: {
  slug: string;
  task: LiveTask;
  onCancelHref: string;
}) {
  return (
    <form action={updateTaskAction} className="bg-white border-2 border-accent-fg rounded-md p-3 space-y-3">
      <input type="hidden" name="id" value={task.id} />
      <input type="hidden" name="projectSlug" value={slug} />
      <input type="hidden" name="redirectTo" value={`/projects/${slug}/flow/j`} />
      <div className="text-[11px] uppercase tracking-wider text-accent-fg font-semibold">Task 수정</div>
      <TaskFormFields
        defaultTitle={task.title}
        defaultGoal={task.goal}
        defaultSubtasks={task.subtasks}
        defaultStatus={task.status}
        defaultBucket={task.bucket}
      />
      <div className="flex items-center pt-1">
        <form action={deleteTaskAction} className="contents">
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="projectSlug" value={slug} />
          <input type="hidden" name="redirectTo" value={`/projects/${slug}/flow/j`} />
          <button
            type="submit"
            className="px-3 py-1 text-xs text-danger-fg border border-danger-fg/30 rounded hover:bg-danger-subtle inline-flex items-center gap-1"
          >
            <TrashIcon size={12} /> 삭제
          </button>
        </form>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Link href={onCancelHref} className="px-3 py-1 text-xs border border-border-default rounded hover:bg-canvas-subtle">취소</Link>
          <button type="submit" className="px-3 py-1 text-xs bg-accent-fg text-white rounded hover:opacity-90">저장</button>
        </div>
      </div>
    </form>
  );
}

// =====================================================================
// Task card (compact, with edit affordance)
// =====================================================================

function TaskCard({
  task,
  slug,
  isActive,
  selectHref,
  editHref,
  showEditAffordance,
}: {
  task: LiveTask;
  slug: string;
  isActive: boolean;
  selectHref: string;
  editHref: string;
  showEditAffordance: boolean;
}) {
  return (
    <div className="relative">
      <Link
        href={selectHref + '#filtered'}
        className={cn(
          'relative block bg-white border rounded-md px-2.5 py-2 transition-colors',
          isActive
            ? 'border-accent-fg ring-2 ring-accent-fg/30'
            : 'border-border-default hover:border-accent-fg',
        )}
      >
        {task.isNew && (
          <span className="absolute -top-1 -right-1 bg-danger-fg text-white text-[9px] font-semibold px-1 py-px rounded-full shadow-sm leading-none">
            New!
          </span>
        )}
        <div className="flex items-center gap-2 pr-6">
          <span
            className={cn(
              'inline-block w-1.5 h-1.5 rounded-full shrink-0',
              task.status === 'done' && 'bg-success-fg',
              task.status === 'in_progress' && 'bg-attention-fg',
              task.status === 'pending' && 'bg-fg-muted',
            )}
          />
          <span className="text-sm font-semibold text-fg-default truncate flex-1">{task.title}</span>
          <span className="text-[10px] text-fg-muted font-mono shrink-0">{task.eventCount}</span>
        </div>
        {task.subtasks.length > 0 ? (
          <ul className="text-[11px] text-fg-muted leading-snug list-none pl-3.5 mt-0.5 space-y-0.5">
            {task.subtasks.map((s, i) => (
              <li key={i} className="truncate">· {s}</li>
            ))}
          </ul>
        ) : task.goal ? (
          <p className="text-[11px] text-fg-muted leading-snug pl-3.5 mt-0.5 line-clamp-1">{task.goal}</p>
        ) : null}
      </Link>
      {showEditAffordance && (
        <Link
          href={editHref}
          aria-label="Edit task"
          className="absolute top-1 right-1 text-fg-muted hover:text-accent-fg p-1 z-10 bg-white rounded"
        >
          <PencilIcon size={12} />
        </Link>
      )}
    </div>
  );
}

// =====================================================================
// Event card with assigned-task chips (re-assign UI)
// =====================================================================

function EventEditForm({
  slug,
  event,
  onCancelHref,
}: {
  slug: string;
  event: FlowEvent & { id: number };
  onCancelHref: string;
}) {
  const numbersText = (event.numbers ?? []).map(n => `${n.label}: ${n.value}`).join('\n');
  const bulletsText = (event.bullets ?? []).join('\n');
  return (
    <form action={updateFlowEventAction} className="bg-white border-2 border-accent-fg rounded-md p-4 space-y-3">
      <input type="hidden" name="id" value={event.id} />
      <input type="hidden" name="projectSlug" value={slug} />
      <input type="hidden" name="redirectTo" value={onCancelHref} />
      <div className="text-[11px] uppercase tracking-wider text-accent-fg font-semibold">Event 수정</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">Date</label>
          <input
            name="date"
            defaultValue={event.date}
            className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">Tone</label>
          <select name="tone" defaultValue={event.tone} className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm">
            <option value="milestone">milestone (마일스톤)</option>
            <option value="result">result (결과)</option>
            <option value="pivot">pivot (피벗)</option>
            <option value="design">design (설계)</option>
            <option value="incident">incident (인시던트)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">제목</label>
        <input
          name="title"
          required
          defaultValue={event.title}
          className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">요약</label>
        <textarea
          name="summary"
          rows={3}
          defaultValue={event.summary}
          className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm leading-relaxed"
        />
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">Bullets (한 줄당 1개)</label>
        <textarea
          name="bullets"
          rows={3}
          defaultValue={bulletsText}
          className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm font-mono"
          placeholder="짧은 사실 한 줄"
        />
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-1">Numbers (한 줄에 'label: value')</label>
        <textarea
          name="numbers"
          rows={3}
          defaultValue={numbersText}
          className="w-full bg-white border border-border-default rounded px-2 py-1.5 text-sm font-mono"
          placeholder="MELON ASR: 0.305"
        />
      </div>
      <div className="flex items-center pt-1">
        <form action={deleteFlowEventAction} className="contents">
          <input type="hidden" name="id" value={event.id} />
          <input type="hidden" name="projectSlug" value={slug} />
          <input type="hidden" name="redirectTo" value={onCancelHref} />
          <button
            type="submit"
            className="px-3 py-1 text-xs text-danger-fg border border-danger-fg/30 rounded hover:bg-danger-subtle inline-flex items-center gap-1"
          >
            <TrashIcon size={12} /> 삭제
          </button>
        </form>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Link href={onCancelHref} className="px-3 py-1 text-xs border border-border-default rounded hover:bg-canvas-subtle">취소</Link>
          <button type="submit" className="px-3 py-1 text-xs bg-accent-fg text-white rounded hover:opacity-90">저장</button>
        </div>
      </div>
    </form>
  );
}

function EventCardWithLinks({
  event,
  eventId,
  slug,
  allTasks,
  links,
  editHref,
  showEditAffordance,
  showLinkEditing,
}: {
  event: FlowEvent;
  eventId: number;
  slug: string;
  allTasks: LiveTask[];
  links: EventLink[];
  editHref: string;
  showEditAffordance: boolean;   // pencil for editing event content
  showLinkEditing: boolean;      // X / + for adding/removing task links
}) {
  const tasksById = new Map(allTasks.map(t => [t.id, t]));
  const eventLinks = links.filter(l => l.eventSource === event.source);
  const assignedIds = new Set(eventLinks.map(l => l.todoId));
  const unassigned = allTasks.filter(t => !assignedIds.has(t.id));

  return (
    <div>
      <div className="relative">
        <TimelineCard event={event} />
        {showEditAffordance && (
          <Link
            href={editHref}
            aria-label="Edit event"
            className="absolute top-2 right-2 text-fg-muted hover:text-accent-fg p-1.5 z-10 bg-white rounded shadow-sm border border-border-muted"
          >
            <PencilIcon size={14} />
          </Link>
        )}
      </div>
      <div className="bg-canvas-subtle border border-border-muted border-t-0 rounded-b-md px-3 py-2 -mt-1">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-fg-muted font-semibold">Tasks</span>
          {eventLinks.length === 0 && (
            <span className="text-xs text-fg-muted italic">없음</span>
          )}
          {eventLinks.map(l => {
            const t = tasksById.get(l.todoId);
            if (!t) return null;
            return (
              <span
                key={l.id}
                className="inline-flex items-center gap-1 bg-white border border-border-default rounded-full px-2 py-0.5 text-xs"
                title={`${l.source === 'llm' ? 'LLM 분류' : '수동 분류'}`}
              >
                <span
                  className={cn(
                    'inline-block w-1 h-1 rounded-full',
                    l.source === 'llm' ? 'bg-accent-fg' : 'bg-success-fg',
                  )}
                />
                <span className="truncate max-w-[180px]">{t.title}</span>
                {showLinkEditing && (
                  <form action={unlinkEventFromTaskAction} className="contents">
                    <input type="hidden" name="projectSlug" value={slug} />
                    <input type="hidden" name="eventSource" value={event.source} />
                    <input type="hidden" name="todoId" value={t.id} />
                    <button type="submit" aria-label="Unlink" className="text-fg-muted hover:text-danger-fg ml-0.5">
                      <XIcon size={10} />
                    </button>
                  </form>
                )}
              </span>
            );
          })}
          {showLinkEditing && unassigned.length > 0 && (
            <form action={linkEventToTaskAction} className="inline-flex items-center gap-1">
              <input type="hidden" name="projectSlug" value={slug} />
              <input type="hidden" name="eventSource" value={event.source} />
              <select
                name="todoId"
                defaultValue=""
                className="text-xs bg-white border border-border-default rounded px-1.5 py-0.5"
              >
                <option value="" disabled>+ task 추가</option>
                {unassigned.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <button type="submit" className="text-xs px-1.5 py-0.5 border border-border-default rounded hover:bg-white">추가</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Main section
// =====================================================================

export function TaskKanbanLive({
  slug,
  tasks,
  links,
  events,
  eventIdBySource,
  selectedTaskId,
  addTaskBucket,
  editTaskId,
  editEventId,
  editMode,
}: {
  slug: string;
  tasks: LiveTask[];
  links: EventLink[];
  events: FlowEvent[];
  eventIdBySource: Map<string, number>;  // FlowEvent.source → FlowEvent.id
  selectedTaskId?: number;
  addTaskBucket?: TaskBucket;
  editTaskId?: number;
  editEventId?: number;
  editMode: boolean;
}) {
  const baseHref = `/projects/${slug}/flow/j`;
  // Helper: build URL preserving the relevant state but flipping edit mode.
  function urlWithEdit(on: boolean): string {
    const params = new URLSearchParams();
    if (selectedTaskId) params.set('task', String(selectedTaskId));
    if (on) params.set('edit', '1');
    const qs = params.toString();
    return qs ? `${baseHref}?${qs}` : baseHref;
  }
  const byBucket = new Map<TaskBucket, LiveTask[]>();
  for (const b of BUCKETS) byBucket.set(b, []);
  for (const t of tasks) byBucket.get(t.bucket)?.push(t);

  // Filter events by selected task (using DB links).
  const linksByEvent = new Map<string, EventLink[]>();
  for (const l of links) {
    if (!linksByEvent.has(l.eventSource)) linksByEvent.set(l.eventSource, []);
    linksByEvent.get(l.eventSource)!.push(l);
  }
  const filteredEvents = selectedTaskId
    ? events.filter(e => (linksByEvent.get(e.source) ?? []).some(l => l.todoId === selectedTaskId))
    : events;
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : undefined;

  return (
    <div className="space-y-6">
      {/* Top-right edit mode toggle */}
      <div className="flex items-center justify-end -mb-2">
        <Link
          href={urlWithEdit(!editMode)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border transition-colors',
            editMode
              ? 'bg-accent-fg text-white border-accent-fg'
              : 'bg-white border-border-default text-fg-muted hover:border-accent-fg',
          )}
        >
          <PencilIcon size={12} />
          {editMode ? '수정 모드 끄기' : '수정 모드'}
        </Link>
      </div>

      {/* Top: 3-column kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BUCKETS.map(b => {
          const list = byBucket.get(b) ?? [];
          return (
            <div key={b} className="bg-canvas-subtle rounded-md p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold">
                  {bucketLabel(b)} <span className="ml-1 opacity-60">{list.length}</span>
                </div>
                {editMode && addTaskBucket !== b && (
                  <Link
                    href={`${baseHref}?addTask=${b}${selectedTaskId ? `&task=${selectedTaskId}` : ''}&edit=1`}
                    className="text-fg-muted hover:text-accent-fg p-0.5"
                    aria-label={`Add task to ${b}`}
                  >
                    <PlusIcon size={14} />
                  </Link>
                )}
              </div>
              <ul className="list-none pl-0 space-y-2">
                {list.map(t => {
                  const isActive = t.id === selectedTaskId;
                  const selectHref = isActive
                    ? baseHref
                    : `${baseHref}?task=${t.id}`;
                  const editHref = `${baseHref}?editTask=${t.id}${selectedTaskId ? `&task=${selectedTaskId}` : ''}`;
                  if (editMode && editTaskId === t.id) {
                    return (
                      <li key={t.id}>
                        <EditTaskForm
                          slug={slug}
                          task={t}
                          onCancelHref={`${baseHref}?${selectedTaskId ? `task=${selectedTaskId}&` : ''}edit=1`}
                        />
                      </li>
                    );
                  }
                  return (
                    <li key={t.id}>
                      <TaskCard
                        task={t}
                        slug={slug}
                        isActive={isActive}
                        selectHref={selectHref}
                        editHref={`${editHref}&edit=1`}
                        showEditAffordance={editMode}
                      />
                    </li>
                  );
                })}
                {editMode && addTaskBucket === b && (
                  <li>
                    <AddTaskForm
                      slug={slug}
                      bucket={b}
                      onCancelHref={`${baseHref}?${selectedTaskId ? `task=${selectedTaskId}&` : ''}edit=1`}
                    />
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Bottom: filtered timeline with re-assignment chips */}
      <div id="filtered" className="pt-2">
        <div className="text-xs text-fg-muted mb-3">
          {selectedTask ? (
            <>
              <span className="font-semibold text-fg-default">{selectedTask.title}</span>
              {' '}에 분류된 events {filteredEvents.length}개
              {' · '}
              <Link href={baseHref} className="hover:underline">선택 해제</Link>
            </>
          ) : (
            <>전체 events {events.length}개 — 위 task 카드를 클릭해서 필터.</>
          )}
        </div>
        {filteredEvents.length === 0 ? (
          <div className="bg-white border border-border-default rounded-md p-6 text-sm text-fg-muted text-center">
            이 task 에 분류된 events 가 없습니다. 아래에서 다른 event 의 분류를 추가하거나, 전체 보기로 가서 추가하세요.
          </div>
        ) : (
          <ol className="relative border-l border-border-default pl-6 space-y-4 list-none">
            {filteredEvents.map(e => {
              const tone = eventTone(e.tone);
              const eid = eventIdBySource.get(e.source);
              const cancelHref = selectedTaskId ? `${baseHref}?task=${selectedTaskId}` : baseHref;
              const editHref = `${baseHref}?editEvent=${eid}${selectedTaskId ? `&task=${selectedTaskId}` : ''}`;
              const isEditing = eid !== undefined && eid === editEventId;
              return (
                <li key={e.source} className="relative">
                  <span
                    className={`absolute -left-[34px] top-1.5 w-3 h-3 rounded-full bg-white border-2 ${tone.ring}`}
                  />
                  {editMode && isEditing && eid !== undefined ? (
                    <EventEditForm slug={slug} event={{ ...e, id: eid }} onCancelHref={cancelHref + (selectedTaskId ? '&edit=1' : '?edit=1')} />
                  ) : (
                    <EventCardWithLinks
                      event={e}
                      eventId={eid ?? -1}
                      slug={slug}
                      allTasks={tasks}
                      links={links}
                      editHref={editHref + '&edit=1'}
                      showEditAffordance={editMode}
                      showLinkEditing={editMode}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
