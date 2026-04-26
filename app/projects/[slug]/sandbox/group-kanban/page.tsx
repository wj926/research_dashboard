// Mockup of "Option A — Group" kanban variant. Pure visual mockup with
// hardcoded data. Does NOT touch the real DB / schema. Deletable.

import Link from 'next/link';
import { ChevronLeftIcon } from '@primer/octicons-react';
import { cn } from '@/lib/cn';

type MockTask = {
  id: number;
  bucket: 'short' | 'mid' | 'long';
  group: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  isNew: boolean;
  eventCount: number;
  subtasks?: string[];
  goal?: string;
};

const TASKS: MockTask[] = [
  // ---------- 단기 ----------
  // MELON 우회 공격 탐색
  { id: 1, bucket: 'short', group: 'MELON 우회 공격 탐색', title: 'fake_completion_Nx × MELON N-sweep', status: 'in_progress', isNew: true, eventCount: 3, subtasks: ['qwen3:32b N ∈ {10..50}', 'qwen3:235b N ∈ {10..50}'] },
  { id: 2, bucket: 'short', group: 'MELON 우회 공격 탐색', title: 'temporal_sysframe + 235b MELON', status: 'in_progress', isNew: true, eventCount: 1 },
  { id: 3, bucket: 'short', group: 'MELON 우회 공격 탐색', title: 'trigger (suite-vocab gate) 설계 + MELON 검증', status: 'in_progress', isNew: true, eventCount: 2, subtasks: ['banking/travel 가설 ✅', 'slack/workspace ❌ → trigger_v2 필요'] },
  // Defense landscape 측정
  { id: 4, bucket: 'short', group: 'Defense landscape 측정', title: 'Cross-model defense matrix (32b/70b/35b)', status: 'in_progress', isNew: true, eventCount: 1 },
  { id: 5, bucket: 'short', group: 'Defense landscape 측정', title: 'fake_completion_30x × 4-defense + IPIGuard 포팅', status: 'in_progress', isNew: true, eventCount: 2, subtasks: ['no_def/MELON/tool_filter 완주', 'IPIGuard 포팅 + sweep'] },
  // 인프라
  { id: 6, bucket: 'short', group: '인프라', title: 'HTML viewer + reports', status: 'in_progress', isNew: true, eventCount: 1 },

  // ---------- 중기 ----------
  { id: 7, bucket: 'mid', group: 'EMNLP 논문', title: 'attack 섹션 최종안 결정', status: 'pending', isNew: false, eventCount: 0, goal: 'trigger / trigger_fake / universal 중 메인 + ablation' },
  { id: 8, bucket: 'mid', group: 'EMNLP 논문', title: 'related work 정리', status: 'pending', isNew: false, eventCount: 0 },
  { id: 9, bucket: 'mid', group: 'EMNLP 논문', title: 'IPIGuard argument poisoning PoC', status: 'pending', isNew: false, eventCount: 0 },
  { id: 10, bucket: 'mid', group: 'ICML Workshop', title: 'DAMIAttack v4 실험', status: 'in_progress', isNew: false, eventCount: 0 },

  // ---------- 장기 ----------
  { id: 11, bucket: 'long', group: '제출 마감', title: 'EMNLP 2026 제출', status: 'in_progress', isNew: false, eventCount: 0 },
  { id: 12, bucket: 'long', group: '제출 마감', title: 'ICML Workshop 제출', status: 'in_progress', isNew: false, eventCount: 0 },
];

const BUCKETS: { key: 'short' | 'mid' | 'long'; label: string }[] = [
  { key: 'short', label: '단기 (이번 라운드)' },
  { key: 'mid',   label: '중기 (이번 달)' },
  { key: 'long',  label: '장기 (분기 / 제출)' },
];

function statusDot(s: MockTask['status']) {
  return cn(
    'inline-block w-1.5 h-1.5 rounded-full shrink-0',
    s === 'done'        && 'bg-success-fg',
    s === 'in_progress' && 'bg-attention-fg',
    s === 'pending'     && 'bg-fg-muted',
  );
}

function TaskCard({ t }: { t: MockTask }) {
  return (
    <div className="relative bg-white border border-border-default rounded-md px-2.5 py-2">
      {t.isNew && (
        <span className="absolute -top-1 -right-1 bg-danger-fg text-white text-[9px] font-semibold px-1 py-px rounded-full shadow-sm leading-none">New!</span>
      )}
      <div className="flex items-center gap-2">
        <span className={statusDot(t.status)} />
        <span className="text-sm font-semibold text-fg-default truncate flex-1">{t.title}</span>
        <span className="text-[10px] text-fg-muted font-mono shrink-0">{t.eventCount}</span>
      </div>
      {t.subtasks && t.subtasks.length > 0 ? (
        <ul className="text-[11px] text-fg-muted leading-snug list-none pl-3.5 mt-0.5 space-y-0.5">
          {t.subtasks.map((s, i) => <li key={i} className="truncate">· {s}</li>)}
        </ul>
      ) : t.goal ? (
        <p className="text-[11px] text-fg-muted leading-snug pl-3.5 mt-0.5 line-clamp-1">{t.goal}</p>
      ) : null}
    </div>
  );
}

function GroupedColumn({ tasks, label }: { tasks: MockTask[]; label: string }) {
  // Group by .group while preserving insertion order
  const groups = new Map<string, MockTask[]>();
  for (const t of tasks) {
    if (!groups.has(t.group)) groups.set(t.group, []);
    groups.get(t.group)!.push(t);
  }
  return (
    <div className="bg-canvas-subtle rounded-md p-3">
      <div className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-3 px-1">
        {label} <span className="ml-1 opacity-60">{tasks.length}</span>
      </div>
      <div className="space-y-4">
        {[...groups.entries()].map(([group, groupTasks]) => (
          <details key={group} open className="group">
            <summary className="cursor-pointer list-none flex items-center gap-1 text-[11px] font-semibold text-fg-default mb-1.5 pl-0.5 select-none">
              <span className="inline-block transition-transform group-open:rotate-90 text-fg-muted">▶</span>
              <span>{group}</span>
              <span className="text-fg-muted font-normal">{groupTasks.length}</span>
            </summary>
            <ul className="list-none pl-0 space-y-2">
              {groupTasks.map(t => <li key={t.id}><TaskCard t={t} /></li>)}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}

function FlatColumn({ tasks, label }: { tasks: MockTask[]; label: string }) {
  return (
    <div className="bg-canvas-subtle rounded-md p-3">
      <div className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-3 px-1">
        {label} <span className="ml-1 opacity-60">{tasks.length}</span>
      </div>
      <ul className="list-none pl-0 space-y-2">
        {tasks.map(t => (
          <li key={t.id}>
            <div className="space-y-1">
              <TaskCard t={t} />
              <div className="text-[10px] text-fg-muted pl-3 italic">↳ {t.group}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function GroupKanbanMockup({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tasksByBucket = (b: string) => TASKS.filter(t => t.bucket === b);

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-10">
      <Link href={`/projects/${slug}/sandbox`} className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-accent-fg">
        <ChevronLeftIcon size={14} /> Sandbox
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Group Kanban (Option A mockup)</h1>
        <p className="text-sm text-fg-muted mt-1">
          단기/중기/장기 컬럼 안에서 task 들이 group 별로 묶여 표시. group 헤더는 collapsible.
          현재 7개 group 예시 (MELON 우회 공격 탐색 / Defense landscape / 인프라 / EMNLP 논문 / ICML Workshop / 제출 마감).
        </p>
      </header>

      <section>
        <h2 className="text-base font-semibold mb-4">Variant 1 — Group 헤더로 묶기 (collapsible)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BUCKETS.map(b => (
            <GroupedColumn key={b.key} tasks={tasksByBucket(b.key)} label={b.label} />
          ))}
        </div>
      </section>

      <section className="pt-6 border-t border-border-muted">
        <h2 className="text-base font-semibold mb-4">Variant 2 — Group 라벨만 카드 아래에 (헤더 없음)</h2>
        <p className="text-xs text-fg-muted mb-4">최소 변경. 카드 아래 작은 ↳ group 표시. 시각적 구분 약함.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BUCKETS.map(b => (
            <FlatColumn key={b.key} tasks={tasksByBucket(b.key)} label={b.label} />
          ))}
        </div>
      </section>
    </div>
  );
}
