import Link from 'next/link';
import { cn } from '@/lib/cn';
import { LabelChip, type LabelTone } from '@/components/badges/LabelChip';
import { MarkdownBody } from '@/components/md/MarkdownBody';
import { newnessFromString } from '@/components/flow/task-kanban-helpers';
import {
  type FlowEvent,
  type FlowEventTone,
  type AttackCard,
  type AttackStatus,
  type TreeNode,
  type Phase,
  type AttackLifeline,
  type LifelineMarker,
  type TaskItem,
  type TaskBucket,
  type TaskStatus,
  type TagDef,
  type TagGroup,
} from '@/lib/mock/ipi-flow-data';

// =====================================================================
// Shared helpers
// =====================================================================

export function eventTone(tone: FlowEventTone): { ring: string; chip: LabelTone; label: string } {
  switch (tone) {
    case 'milestone':  return { ring: 'border-accent-fg',     chip: 'accent',    label: '마일스톤' };
    case 'pivot':      return { ring: 'border-attention-fg',  chip: 'attention', label: '피벗' };
    case 'result':     return { ring: 'border-success-fg',    chip: 'success',   label: '결과' };
    case 'incident':   return { ring: 'border-danger-fg',     chip: 'danger',    label: '인시던트' };
    case 'design':     return { ring: 'border-done-fg',       chip: 'done',      label: '설계' };
    case 'deprecated': return { ring: 'border-fg-muted',      chip: 'neutral',   label: '폐기' };
  }
}

export function attackStatusTone(s: AttackStatus): LabelTone {
  switch (s) {
    case 'designed':   return 'neutral';
    case 'running':    return 'attention';
    case 'done':       return 'success';
    case 'deprecated': return 'danger';
  }
}

export function attackStatusLabel(s: AttackStatus): string {
  switch (s) {
    case 'designed':   return 'Designed';
    case 'running':    return 'Running';
    case 'done':       return 'Done';
    case 'deprecated': return 'Deprecated';
  }
}

export function taskStatusTone(s: TaskStatus): LabelTone {
  switch (s) {
    case 'pending':     return 'neutral';
    case 'in_progress': return 'attention';
    case 'done':        return 'success';
  }
}

export function taskStatusLabel(s: TaskStatus): string {
  switch (s) {
    case 'pending':     return 'Pending';
    case 'in_progress': return 'In progress';
    case 'done':        return 'Done';
  }
}

export function bucketLabel(b: TaskBucket): string {
  switch (b) {
    case 'short': return '단기 (이번 라운드)';
    case 'mid':   return '중기 (이번 달)';
    case 'long':  return '장기 (분기 / 제출)';
  }
}

export function tagGroupLabel(g: TagGroup): string {
  switch (g) {
    case 'theme':    return '연구 주제';
    case 'activity': return '작업 종류';
    case 'paper':    return '논문';
  }
}

/**
 * Escape angle-bracketed tokens that look like HTML tags but aren't valid HTML —
 * markdown/HTML parsers silently strip these, breaking surrounding text.
 *
 * Patterns handled:
 *   <|im_end|>, <|im_start|>     — chat template
 *   <INFORMATION>, <TOOL_RETURNED_DATA>  — framework markers (uppercase tags)
 *   <unknown>                    — literal placeholder seen in IPIGuard etc.
 *
 * Inline code (`<...>`) and fenced code blocks are protected first.
 */
export function escapeFrameworkTokens(md: string): string {
  // Walk through, splitting on fenced code blocks so we don't escape within them.
  const parts = md.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // inside fenced code, leave as-is
      // Protect inline code spans next
      const inline = part.split(/(`[^`\n]+`)/g);
      return inline
        .map((seg, j) => {
          if (j % 2 === 1) return seg; // inside inline code
          return seg
            .replace(/<\|/g, '&lt;|')
            .replace(/\|>/g, '|&gt;')
            .replace(/<([A-Z][A-Z_0-9]*)>/g, '&lt;$1&gt;')
            .replace(/<unknown>/g, '&lt;unknown&gt;');
        })
        .join('');
    })
    .join('');
}

function markerColor(kind: LifelineMarker['kind']): string {
  switch (kind) {
    case 'designed':   return 'bg-fg-muted';
    case 'running':    return 'bg-attention-fg';
    case 'milestone':  return 'bg-accent-fg';
    case 'done':       return 'bg-success-fg';
    case 'deprecated': return 'bg-danger-fg';
  }
}

// =====================================================================
// Reusable timeline card (used by Option A and Option I)
// =====================================================================

export function TimelineCard({ event }: { event: FlowEvent }) {
  const tone = eventTone(event.tone);
  const newness = newnessFromString(event.date);
  return (
    <div className="relative bg-white border border-border-default rounded-md p-4 pr-10">
      {newness > 0 && (
        <span
          className="absolute top-1 left-1 bg-danger-fg text-white text-[9px] font-semibold px-1 py-px rounded-full shadow-sm leading-none z-10"
          style={{ opacity: newness }}
        >
          New!
        </span>
      )}
      <div className="flex items-center gap-2 text-xs text-fg-muted mb-1 flex-wrap">
        <span className="font-mono">{event.date}</span>
        <LabelChip tone={tone.chip}>{tone.label}</LabelChip>
        <span className="font-mono opacity-70 break-all">{event.source}</span>
      </div>
      <h3 className="text-base font-semibold mb-2">{event.title}</h3>
      <p className="text-sm text-fg-default leading-relaxed mb-2">{event.summary}</p>
      {event.bullets && (
        <ul className="text-sm text-fg-muted list-disc pl-5 space-y-0.5 mb-2">
          {event.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
      {event.numbers && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {event.numbers.map((n, i) => (
            <span key={i} className="text-[11px] font-mono bg-canvas-subtle px-2 py-0.5 rounded">
              {n.label}: <span className="font-semibold text-fg-default">{n.value}</span>
            </span>
          ))}
        </div>
      )}
      {event.sourceContent && (
        <details className="mt-3 border-t border-border-muted pt-2 group">
          <summary className="text-xs text-fg-muted cursor-pointer hover:text-accent-fg select-none list-none flex items-center gap-1">
            <span className="inline-block transition-transform group-open:rotate-90">▶</span>
            <span>원본 progress.md 보기 ({event.source})</span>
          </summary>
          <div className="mt-3 max-h-[600px] overflow-y-auto bg-canvas-subtle rounded p-4">
            <MarkdownBody source={escapeFrameworkTokens(event.sourceContent)} size="sm" />
          </div>
        </details>
      )}
    </div>
  );
}

function TimelineList({ events }: { events: FlowEvent[] }) {
  if (events.length === 0) {
    return <div className="text-sm text-fg-muted italic py-4">매칭되는 events 없음</div>;
  }
  return (
    <ol className="relative border-l border-border-default pl-6 space-y-4 list-none">
      {events.map(e => {
        const tone = eventTone(e.tone);
        return (
          <li key={e.source} className="relative">
            <span className={`absolute -left-[30px] top-4 w-3 h-3 rounded-full bg-white border-2 ${tone.ring}`} />
            <TimelineCard event={e} />
          </li>
        );
      })}
    </ol>
  );
}

// =====================================================================
// Option A — Timeline + 카드
// =====================================================================

export function TimelineSection({ events }: { events: FlowEvent[] }) {
  return <TimelineList events={events} />;
}

// =====================================================================
// Option B — Narrative
// =====================================================================

export function NarrativeSection({ narrative }: { narrative: string }) {
  return (
    <div className="bg-canvas-subtle rounded-md p-6">
      <MarkdownBody source={narrative} size="base" />
    </div>
  );
}

// =====================================================================
// Option C — Lineage tree
// =====================================================================

function TreeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const isLeaf = !node.children || node.children.length === 0;
  return (
    <>
      <div className="flex items-baseline gap-2 py-1 font-mono text-sm">
        <span style={{ paddingLeft: `${depth * 20}px` }} className="text-fg-muted">
          {depth === 0 ? '●' : '└─'}
        </span>
        <span className="font-semibold">{node.name}</span>
        {node.note && <span className="text-fg-muted text-xs">— {node.note}</span>}
      </div>
      {!isLeaf && node.children!.map(c => (
        <TreeRow key={c.name} node={c} depth={depth + 1} />
      ))}
    </>
  );
}

export function TreeSection({ root }: { root: TreeNode }) {
  return (
    <div className="bg-white border border-border-default rounded-md p-5">
      <TreeRow node={root} depth={0} />
    </div>
  );
}

// =====================================================================
// Option D — Status board (Kanban)
// =====================================================================

export function BoardSection({ cards }: { cards: AttackCard[] }) {
  const cols: AttackStatus[] = ['designed', 'running', 'done', 'deprecated'];
  const byStatus = new Map<AttackStatus, AttackCard[]>();
  for (const s of cols) byStatus.set(s, []);
  for (const c of cards) byStatus.get(c.status)?.push(c);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {cols.map(s => {
        const list = byStatus.get(s) ?? [];
        return (
          <div key={s} className="bg-canvas-subtle rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <LabelChip tone={attackStatusTone(s)}>{attackStatusLabel(s)}</LabelChip>
              <span className="text-xs text-fg-muted">{list.length}</span>
            </div>
            <ul className="list-none pl-0 space-y-2">
              {list.map(c => (
                <li key={c.name} className="bg-white border border-border-default rounded p-2">
                  <div className="font-mono text-sm font-semibold">{c.name}</div>
                  {c.metric && <div className="text-[11px] font-mono text-fg-muted mt-0.5">{c.metric}</div>}
                  {c.note && <div className="text-xs text-fg-muted mt-1">{c.note}</div>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================================
// Option E — Phase 그룹
// =====================================================================

export function PhaseSection({ phases, events }: { phases: Phase[]; events: FlowEvent[] }) {
  const eventsBySource = new Map(events.map(e => [e.source, e]));
  return (
    <div className="space-y-4">
      {phases.map(p => (
        <details key={p.id} open className="bg-white border border-border-default rounded-md">
          <summary className="cursor-pointer px-5 py-4 list-none">
            <div className="flex items-baseline gap-3">
              <span className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold">Phase</span>
              <span className="font-mono text-xs text-fg-muted">{p.period}</span>
            </div>
            <h3 className="text-base font-semibold mt-1">{p.title}</h3>
            <p className="text-sm text-fg-muted mt-1">{p.summary}</p>
          </summary>
          <div className="px-5 pb-5 border-t border-border-muted pt-4">
            <div className="text-xs uppercase tracking-wider text-fg-muted font-semibold mb-1">Outcome</div>
            <p className="text-sm text-fg-default mb-4">{p.outcome}</p>
            <div className="text-xs uppercase tracking-wider text-fg-muted font-semibold mb-2">Events</div>
            <ul className="list-none pl-0 space-y-2">
              {p.eventSources.map(src => {
                const e = eventsBySource.get(src);
                if (!e) return null;
                const tone = eventTone(e.tone);
                return (
                  <li key={src} className="border-l-2 pl-3 py-0.5">
                    <div className="flex items-baseline gap-2 text-xs text-fg-muted">
                      <span className="font-mono">{e.date}</span>
                      <LabelChip tone={tone.chip}>{tone.label}</LabelChip>
                    </div>
                    <div className="text-sm font-semibold">{e.title}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        </details>
      ))}
    </div>
  );
}

// =====================================================================
// Option F — Compact digest
// =====================================================================

export function DigestSection({ events }: { events: FlowEvent[] }) {
  return (
    <div className="bg-white border border-border-default rounded-md divide-y divide-border-muted font-mono text-xs">
      {events.map(e => {
        const tone = eventTone(e.tone);
        const firstNumber = e.numbers?.[0];
        return (
          <div key={e.source} className="flex items-center gap-3 px-3 py-2">
            <span className="text-fg-muted whitespace-nowrap">{e.date}</span>
            <span className="w-16 text-center">
              <LabelChip tone={tone.chip}>{tone.label}</LabelChip>
            </span>
            <span className="flex-1 truncate text-sm font-sans text-fg-default">{e.title}</span>
            {firstNumber && (
              <span className="text-fg-muted whitespace-nowrap">
                {firstNumber.label}: <span className="text-fg-default font-semibold">{firstNumber.value}</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =====================================================================
// Option G — Per-attack lifeline
// =====================================================================

export function LifelineSection({ lifelines }: { lifelines: AttackLifeline[] }) {
  return (
    <div className="bg-white border border-border-default rounded-md divide-y divide-border-muted">
      {lifelines.map(l => (
        <div key={l.name} className="grid grid-cols-[200px_120px_minmax(0,1fr)] gap-3 items-start px-4 py-3">
          <div className="font-mono text-sm font-semibold truncate">{l.name}</div>
          <div className="flex items-center">
            <LabelChip tone={attackStatusTone(l.finalStatus)}>{attackStatusLabel(l.finalStatus)}</LabelChip>
          </div>
          <ol className="list-none pl-0 space-y-1">
            {l.markers.map((m, i) => (
              <li key={i} className="flex items-baseline gap-2 text-xs">
                <span className={`inline-block w-2 h-2 rounded-full ${markerColor(m.kind)} translate-y-[1px] shrink-0`} />
                <span className="font-mono text-fg-muted whitespace-nowrap">{m.date}</span>
                <span className="font-mono uppercase text-[10px] text-fg-muted w-20 shrink-0">{m.kind}</span>
                <span className="text-fg-default">{m.note}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

// =====================================================================
// Option H — Task 그룹
// =====================================================================

export function TaskGroupSection({ tasks, events }: { tasks: TaskItem[]; events: FlowEvent[] }) {
  const buckets: TaskBucket[] = ['short', 'mid', 'long'];
  const eventsBySource = new Map(events.map(e => [e.source, e]));
  const byBucket = new Map<TaskBucket, TaskItem[]>();
  for (const b of buckets) byBucket.set(b, []);
  for (const t of tasks) byBucket.get(t.bucket)?.push(t);

  return (
    <div className="space-y-8">
      {buckets.map(b => {
        const list = byBucket.get(b) ?? [];
        return (
          <div key={b}>
            <h3 className="text-base font-semibold mb-3">
              {bucketLabel(b)} <span className="text-fg-muted text-xs font-normal">{list.length}</span>
            </h3>
            {list.length === 0 ? (
              <div className="text-sm text-fg-muted italic">없음</div>
            ) : (
              <ul className="list-none pl-0 space-y-3">
                {list.map(t => (
                  <li key={t.id} className="bg-white border border-border-default rounded-md">
                    <div className="px-4 py-3 border-b border-border-muted">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{t.title}</span>
                        <LabelChip tone={taskStatusTone(t.status)}>{taskStatusLabel(t.status)}</LabelChip>
                      </div>
                      <p className="text-xs text-fg-muted leading-relaxed">{t.goal}</p>
                    </div>
                    <ol className="list-none pl-0 px-4 py-2 space-y-1.5">
                      {t.eventSources.map(src => {
                        const e = eventsBySource.get(src);
                        if (!e) return null;
                        return (
                          <li key={src} className="flex items-baseline gap-2 text-xs">
                            <span className="font-mono text-fg-muted whitespace-nowrap">{e.date}</span>
                            <span className="text-fg-default flex-1">{e.title}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =====================================================================
// Option J — Task Kanban + click filter (with "New!" badges)
// =====================================================================

// For mockup determinism: events with date >= NEW_CUTOFF are "new".
const NEW_CUTOFF = '2026-04-25 00:00';

export function TaskKanbanFilterSection({
  slug,
  tasks,
  events,
  selectedTaskId,
}: {
  slug: string;
  tasks: TaskItem[];
  events: FlowEvent[];
  selectedTaskId?: string;
}) {
  const buckets: TaskBucket[] = ['short', 'mid', 'long'];
  const eventsBySource = new Map(events.map(e => [e.source, e]));

  // Augment each task with latest event date + new flag + count.
  const augmented = tasks.map(t => {
    const taskEvents = t.eventSources
      .map(s => eventsBySource.get(s))
      .filter((e): e is FlowEvent => Boolean(e));
    const latestDate = taskEvents.reduce<string>((a, e) => (e.date > a ? e.date : a), '');
    const isNew = latestDate > NEW_CUTOFF;
    return { ...t, latestDate, isNew, eventCount: taskEvents.length };
  });

  const byBucket = new Map<TaskBucket, typeof augmented>();
  for (const b of buckets) byBucket.set(b, []);
  for (const t of augmented) byBucket.get(t.bucket)?.push(t);

  const selectedTask = augmented.find(t => t.id === selectedTaskId);
  const filteredEvents = selectedTask
    ? events.filter(e => selectedTask.eventSources.includes(e.source))
    : events;

  const baseHref = `/projects/${slug}/flow/j`;

  return (
    <div className="space-y-6">
      {/* Top: 3-column kanban of tasks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buckets.map(b => {
          const list = byBucket.get(b) ?? [];
          return (
            <div key={b} className="bg-canvas-subtle rounded-md p-3">
              <div className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-3 px-1">
                {bucketLabel(b)} <span className="ml-1 opacity-60">{list.length}</span>
              </div>
              <ul className="list-none pl-0 space-y-2">
                {list.map(t => {
                  const isActive = t.id === selectedTaskId;
                  const href = isActive ? baseHref : `${baseHref}?task=${encodeURIComponent(t.id)}`;
                  return (
                    <li key={t.id}>
                      <Link
                        href={href + '#filtered'}
                        className={cn(
                          'relative block bg-white border rounded-md px-2.5 py-2 transition-colors',
                          isActive
                            ? 'border-accent-fg ring-2 ring-accent-fg/30'
                            : 'border-border-default hover:border-accent-fg',
                        )}
                      >
                        {t.isNew && (
                          <span className="absolute -top-1 -right-1 bg-danger-fg text-white text-[9px] font-semibold px-1 py-px rounded-full shadow-sm leading-none">
                            New!
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-block w-1.5 h-1.5 rounded-full shrink-0',
                            t.status === 'done'        && 'bg-success-fg',
                            t.status === 'in_progress' && 'bg-attention-fg',
                            t.status === 'pending'     && 'bg-fg-muted',
                          )} />
                          <span className="text-sm font-semibold text-fg-default truncate flex-1">{t.title}</span>
                          <span className="text-[10px] text-fg-muted font-mono shrink-0">{t.eventCount}</span>
                        </div>
                        {t.subtasks && t.subtasks.length > 0 ? (
                          <ul className="text-[11px] text-fg-muted leading-snug list-none pl-3.5 mt-0.5 space-y-0.5">
                            {t.subtasks.map((s, i) => (
                              <li key={i} className="truncate">· {s}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-fg-muted leading-snug pl-3.5 mt-0.5 line-clamp-1">
                            {t.goal}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Bottom: filtered timeline */}
      <div id="filtered" className="pt-2">
        <div className="text-xs text-fg-muted mb-3">
          {selectedTask ? (
            <>
              <span className="font-semibold text-fg-default">{selectedTask.title}</span>
              {' '}에 기여한 events {filteredEvents.length}개
              {' · '}
              <Link href={baseHref} className="hover:underline">선택 해제</Link>
            </>
          ) : (
            <>전체 events {events.length}개 — 위 task 카드를 클릭해서 필터.</>
          )}
        </div>
        <TimelineList events={filteredEvents} />
      </div>
    </div>
  );
}

// =====================================================================
// Option I — Tag filter (toggle, top tags / bottom timeline)
// =====================================================================

export function TagFilterSection({
  slug,
  tags,
  events,
  selectedTagId,
}: {
  slug: string;
  tags: TagDef[];
  events: FlowEvent[];
  selectedTagId?: string;
}) {
  const groups: TagGroup[] = ['theme', 'activity', 'paper'];
  const selectedTag = tags.find(t => t.id === selectedTagId);
  const filteredEvents = selectedTag
    ? events.filter(e => e.tags?.includes(selectedTag.id))
    : events;

  // Per-tag count for showing badge.
  const countByTag = new Map<string, number>();
  for (const t of tags) countByTag.set(t.id, 0);
  for (const e of events) for (const tid of e.tags ?? []) {
    countByTag.set(tid, (countByTag.get(tid) ?? 0) + 1);
  }

  const baseHref = `/projects/${slug}/flow/i`;

  return (
    <div className="space-y-6">
      {/* Top: tag chips by group */}
      <div className="bg-canvas-subtle rounded-md p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {groups.map(g => {
            const list = tags.filter(t => t.group === g);
            return (
              <div key={g}>
                <div className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-2">
                  {tagGroupLabel(g)}
                </div>
                <ul className="list-none pl-0 flex flex-wrap gap-1.5">
                  {list.map(t => {
                    const isActive = t.id === selectedTagId;
                    const count = countByTag.get(t.id) ?? 0;
                    const href = isActive ? baseHref : `${baseHref}?tag=${encodeURIComponent(t.id)}`;
                    return (
                      <li key={t.id}>
                        <Link
                          href={href + '#filtered'}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors',
                            isActive
                              ? 'bg-accent-fg text-white border-accent-fg'
                              : 'bg-white border-border-default text-fg-default hover:border-accent-fg',
                            count === 0 && 'opacity-40',
                          )}
                          title={t.description}
                        >
                          <span>{t.label}</span>
                          <span className={cn('text-[10px]', isActive ? 'text-white/70' : 'text-fg-muted')}>
                            {count}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: filtered timeline */}
      <div id="filtered">
        <div className="text-xs text-fg-muted mb-3">
          {selectedTag ? (
            <>
              <span className="font-semibold text-fg-default">{selectedTag.label}</span>
              {' '}태그가 붙은 events {filteredEvents.length}개
              {' · '}
              <Link href={baseHref} className="hover:underline">선택 해제</Link>
            </>
          ) : (
            <>전체 events {events.length}개 — 위 태그를 클릭해서 필터.</>
          )}
        </div>
        <TimelineList events={filteredEvents} />
      </div>
    </div>
  );
}
