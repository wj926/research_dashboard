// Mockup of "Option B — Parent/Child" kanban variant. Pure visual mockup
// with hardcoded data. Does NOT touch the real DB / schema. Deletable.

import Link from 'next/link';
import { ChevronLeftIcon } from '@primer/octicons-react';
import { cn } from '@/lib/cn';

type MockTask = {
  id: number;
  parentId?: number;        // undefined = epic (top-level)
  bucket: 'short' | 'mid' | 'long';
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  isNew: boolean;
  eventCount: number;       // for epic, sum of children's events
  goal?: string;
  subtasks?: string[];
};

const TASKS: MockTask[] = [
  // ---------- 단기 ----------
  // Epics
  { id: 100, bucket: 'short', title: 'MELON 우회 공격 탐색', status: 'in_progress', isNew: true, eventCount: 6, goal: 'masked-run / cosine drift 우회 메커니즘 탐색 — 여러 attack 변종 비교' },
  { id: 101, bucket: 'short', title: 'Defense landscape 측정',   status: 'in_progress', isNew: true, eventCount: 3, goal: '공격 × defense 행렬 채워서 defense 효과 정확히 측정' },
  { id: 102, bucket: 'short', title: '인프라',                   status: 'in_progress', isNew: true, eventCount: 1, goal: 'reports / viewer / queue / git 자동화' },
  // Children
  { id: 1, parentId: 100, bucket: 'short', title: 'fake_completion_Nx × MELON N-sweep',          status: 'in_progress', isNew: true, eventCount: 3 },
  { id: 2, parentId: 100, bucket: 'short', title: 'temporal_sysframe + 235b MELON',              status: 'in_progress', isNew: true, eventCount: 1 },
  { id: 3, parentId: 100, bucket: 'short', title: 'trigger (suite-vocab gate) 설계 + MELON 검증', status: 'in_progress', isNew: true, eventCount: 2 },
  { id: 4, parentId: 101, bucket: 'short', title: 'Cross-model defense matrix (32b/70b/35b)',     status: 'in_progress', isNew: true, eventCount: 1 },
  { id: 5, parentId: 101, bucket: 'short', title: 'fake_completion_30x × 4-defense + IPIGuard 포팅', status: 'in_progress', isNew: true, eventCount: 2 },
  { id: 6, parentId: 102, bucket: 'short', title: 'HTML viewer + reports',                        status: 'in_progress', isNew: true, eventCount: 1 },

  // ---------- 중기 ----------
  { id: 200, bucket: 'mid', title: 'EMNLP 논문',     status: 'in_progress', isNew: false, eventCount: 0, goal: '2026 EMNLP submission — defense-bypass 공격론' },
  { id: 201, bucket: 'mid', title: 'ICML Workshop',  status: 'in_progress', isNew: false, eventCount: 0, goal: 'DAMIAttack v4 (dual-success + 흔적없는 공격)' },
  { id: 7, parentId: 200, bucket: 'mid', title: 'attack 섹션 결정',                    status: 'pending', isNew: false, eventCount: 0 },
  { id: 8, parentId: 200, bucket: 'mid', title: 'related work 정리',                   status: 'pending', isNew: false, eventCount: 0 },
  { id: 9, parentId: 200, bucket: 'mid', title: 'IPIGuard argument poisoning PoC',     status: 'pending', isNew: false, eventCount: 0 },
  { id: 10, parentId: 201, bucket: 'mid', title: 'DAMIAttack v4 실험',                 status: 'in_progress', isNew: false, eventCount: 0 },

  // ---------- 장기 ----------
  { id: 300, bucket: 'long', title: '제출 마감',         status: 'in_progress', isNew: false, eventCount: 0, goal: '2026 분기 제출 일정 관리' },
  { id: 11, parentId: 300, bucket: 'long', title: 'EMNLP 2026 제출',     status: 'in_progress', isNew: false, eventCount: 0 },
  { id: 12, parentId: 300, bucket: 'long', title: 'ICML Workshop 제출',  status: 'in_progress', isNew: false, eventCount: 0 },
];

const BUCKETS: { key: 'short' | 'mid' | 'long'; label: string }[] = [
  { key: 'short', label: '단기 (이번 라운드)' },
  { key: 'mid',   label: '중기 (이번 달)' },
  { key: 'long',  label: '장기 (분기 / 제출)' },
];

function statusDot(s: MockTask['status']) {
  return cn(
    'inline-block w-1.5 h-1.5 rounded-full shrink-0',
    s === 'done' && 'bg-success-fg',
    s === 'in_progress' && 'bg-attention-fg',
    s === 'pending' && 'bg-fg-muted',
  );
}

// =====================================================================
// Variant 1 — Parent card contains children visually nested
// =====================================================================

function ChildCard({ t }: { t: MockTask }) {
  return (
    <div className="relative bg-canvas-subtle border border-border-default rounded px-2.5 py-1.5">
      {t.isNew && (
        <span className="absolute -top-1 -right-1 bg-danger-fg text-white text-[9px] font-semibold px-1 py-px rounded-full shadow-sm leading-none">New!</span>
      )}
      <div className="flex items-center gap-2">
        <span className={statusDot(t.status)} />
        <span className="text-xs font-semibold text-fg-default truncate flex-1">{t.title}</span>
        <span className="text-[10px] text-fg-muted font-mono shrink-0">{t.eventCount}</span>
      </div>
    </div>
  );
}

function NestedEpicCard({ epic, children }: { epic: MockTask; children: MockTask[] }) {
  return (
    <div className="relative bg-white border-2 border-accent-fg/30 rounded-md p-3">
      {epic.isNew && (
        <span className="absolute -top-1 -right-1 bg-danger-fg text-white text-[9px] font-semibold px-1 py-px rounded-full shadow-sm leading-none">New!</span>
      )}
      <div className="flex items-center gap-2 mb-1">
        <span className={statusDot(epic.status)} />
        <span className="text-sm font-bold text-fg-default truncate flex-1">{epic.title}</span>
        <span className="text-[10px] text-fg-muted font-mono shrink-0">∑{epic.eventCount}</span>
      </div>
      {epic.goal && <p className="text-[11px] text-fg-muted leading-snug pl-3.5 mb-2">{epic.goal}</p>}
      <ul className="list-none pl-3 mt-2 space-y-1.5 border-l-2 border-border-muted ml-1">
        {children.map(c => (
          <li key={c.id} className="pl-2"><ChildCard t={c} /></li>
        ))}
        {children.length === 0 && (
          <li className="text-xs text-fg-muted italic pl-2">subtask 없음</li>
        )}
      </ul>
    </div>
  );
}

function NestedColumn({ tasks, label }: { tasks: MockTask[]; label: string }) {
  const epics = tasks.filter(t => !t.parentId);
  const childrenByParent = new Map<number, MockTask[]>();
  for (const t of tasks) {
    if (t.parentId) {
      if (!childrenByParent.has(t.parentId)) childrenByParent.set(t.parentId, []);
      childrenByParent.get(t.parentId)!.push(t);
    }
  }
  return (
    <div className="bg-canvas-subtle rounded-md p-3">
      <div className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-3 px-1">
        {label} <span className="ml-1 opacity-60">{epics.length} epic / {tasks.length - epics.length} task</span>
      </div>
      <div className="space-y-3">
        {epics.map(e => (
          <NestedEpicCard key={e.id} epic={e} children={childrenByParent.get(e.id) ?? []} />
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// Variant 2 — Parent header + children flat below (collapsible)
// =====================================================================

function FlatChildCard({ t }: { t: MockTask }) {
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
    </div>
  );
}

function FlatColumn({ tasks, label }: { tasks: MockTask[]; label: string }) {
  const epics = tasks.filter(t => !t.parentId);
  const childrenByParent = new Map<number, MockTask[]>();
  for (const t of tasks) {
    if (t.parentId) {
      if (!childrenByParent.has(t.parentId)) childrenByParent.set(t.parentId, []);
      childrenByParent.get(t.parentId)!.push(t);
    }
  }
  return (
    <div className="bg-canvas-subtle rounded-md p-3">
      <div className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold mb-3 px-1">
        {label} <span className="ml-1 opacity-60">{epics.length} epic / {tasks.length - epics.length} task</span>
      </div>
      <div className="space-y-4">
        {epics.map(e => {
          const kids = childrenByParent.get(e.id) ?? [];
          return (
            <details key={e.id} open className="group">
              <summary className="cursor-pointer list-none mb-1.5 select-none">
                <div className="relative flex items-center gap-1.5 text-fg-default">
                  <span className="inline-block transition-transform group-open:rotate-90 text-fg-muted text-xs">▶</span>
                  <span className={statusDot(e.status)} />
                  <span className="text-[13px] font-bold flex-1 truncate">{e.title}</span>
                  <span className="text-[10px] text-fg-muted font-mono">∑{e.eventCount}</span>
                  {e.isNew && (
                    <span className="bg-danger-fg text-white text-[9px] font-semibold px-1 py-px rounded-full leading-none">New!</span>
                  )}
                </div>
                {e.goal && <p className="text-[11px] text-fg-muted leading-snug pl-7 mt-0.5 line-clamp-1">{e.goal}</p>}
              </summary>
              <ul className="list-none pl-5 space-y-1.5">
                {kids.map(c => (
                  <li key={c.id}><FlatChildCard t={c} /></li>
                ))}
                {kids.length === 0 && (
                  <li className="text-xs text-fg-muted italic">subtask 없음</li>
                )}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================================
// Page
// =====================================================================

export default async function ParentChildKanbanMockup({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tasksByBucket = (b: string) => TASKS.filter(t => t.bucket === b);

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-10">
      <Link href={`/projects/${slug}/sandbox`} className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-accent-fg">
        <ChevronLeftIcon size={14} /> Sandbox
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Parent/Child Kanban (Option B mockup)</h1>
        <p className="text-sm text-fg-muted mt-1">
          큰 task (epic) 가 그 자체로 카드/컨테이너이고, 작은 task 들이 그 안에 child 로 들어감.
          Group 과 다른 점: epic 은 자체 status, goal, 누적 event 수, New! 배지를 가진 entity.
        </p>
      </header>

      <section>
        <h2 className="text-base font-semibold mb-4">Variant 1 — Nested (epic 카드가 children 을 visually 감쌈)</h2>
        <p className="text-xs text-fg-muted mb-4">epic 은 굵은 보더 + 흰 배경 + goal 표시. children 은 epic 안에 들여쓰기로.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BUCKETS.map(b => (
            <NestedColumn key={b.key} tasks={tasksByBucket(b.key)} label={b.label} />
          ))}
        </div>
      </section>

      <section className="pt-6 border-t border-border-muted">
        <h2 className="text-base font-semibold mb-4">Variant 2 — Tree (epic 헤더 + children flat, collapsible)</h2>
        <p className="text-xs text-fg-muted mb-4">epic 은 ▼ 가능한 헤더로. children 은 평소 카드처럼.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BUCKETS.map(b => (
            <FlatColumn key={b.key} tasks={tasksByBucket(b.key)} label={b.label} />
          ))}
        </div>
      </section>

      <section className="pt-6 border-t border-border-muted text-xs text-fg-muted">
        <p>
          <strong>Group(A) 과의 핵심 차이</strong>: Group 은 그냥 string 라벨. Epic(B) 은 자체 task entity 라
          본인의 status / goal / 누적 event 수 / New! 배지가 있고 클릭해서 상세 보기 가능 (현재 mockup 엔
          미구현). 또한 epic 자체에도 event 가 직접 link 될 수 있음 (예: "EMNLP 논문 제출 완료" 같은
          milestone event).
        </p>
      </section>
    </div>
  );
}
