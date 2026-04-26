import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';

type OptionDef = {
  key: string;
  label: string;
  title: string;
  blurb: string;
  whenUseful: string;
};

const OPTIONS: OptionDef[] = [
  { key: 'a', label: 'Option A', title: 'Timeline + 카드',           blurb: '시간순 progress 카드 (가장 단순).', whenUseful: '이번 주 일지 정독' },
  { key: 'd', label: 'Option D', title: 'Status board (Kanban)',       blurb: 'Designed/Running/Done/Deprecated 4 컬럼.', whenUseful: '운영 / GPU 할당 결정' },
  { key: 'e', label: 'Option E', title: 'Phase 그룹 (챕터)',           blurb: '라운드별로 묶인 collapsible 챕터.', whenUseful: '한 달 회고' },
  { key: 'g', label: 'Option G', title: 'Per-attack lifeline (일생)',  blurb: '공격 1개 = 가로 1줄. 디자인→완료/폐기 마커.', whenUseful: '"이거 왜 죽었지" 추적' },
  { key: 'h', label: 'Option H', title: 'Task 그룹 (단기/중기/장기)',  blurb: '각 task 아래에 기여 events 가 펼쳐짐.', whenUseful: 'task 별 누적 진척 한눈에' },
  { key: 'i', label: 'Option I', title: 'Tag filter (toggle)',         blurb: '위 태그 chip 클릭 → 아래 timeline 이 그 태그로 필터.', whenUseful: '"MELON bypass 관련 일만 모아서 보기"' },
  { key: 'j', label: 'Option J', title: 'Task Kanban (New! 배지)',     blurb: '단기/중기/장기 3 컬럼 task Kanban. 최근 활동 있는 카드에 New! 배지.', whenUseful: '"이번 주 student 가 어떤 task 에서 진척 냈나" 한눈에 ★' },
  { key: 'group-kanban',         label: 'Mockup', title: 'Group Kanban (Option A)',         blurb: '단기/중기/장기 컬럼 안에서 task 가 group(string 라벨) 으로 묶임. 2 variant.',           whenUseful: 'task 가 너무 많아서 큰 그림 안 보일 때 — 가벼운 변경' },
  { key: 'parent-child-kanban',  label: 'Mockup', title: 'Parent/Child Kanban (Option B)',  blurb: 'Epic (parent task) 가 자체 entity. children 들어감. 2 variant.',                          whenUseful: 'Epic 자체에도 status/goal/event 필요할 때 — 더 표현력 ↑' },
];

export default async function ProjectSandbox({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) notFound();

  if (slug !== 'ipi-attack') {
    return (
      <div className="max-w-3xl mx-auto py-6 text-sm text-fg-muted">
        Flow view 는 현재 IPI Attack 프로젝트 mockup 데이터만 있습니다.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Sandbox · Flow shape candidates</h1>
        <p className="text-sm text-fg-muted mt-1">
          연구 흐름 표현 후보들. 검토용 임시 보관. 메인 Flow 탭은 J 모양만 사용.
        </p>
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 list-none pl-0">
        {OPTIONS.map(o => (
          <li key={o.key}>
            <Link
              href={o.key.length === 1 ? `/projects/${slug}/flow/${o.key}` : `/projects/${slug}/sandbox/${o.key}`}
              className="block bg-white border border-border-default rounded-md p-4 hover:border-accent-fg hover:bg-canvas-subtle transition-colors h-full"
            >
              <div className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold">{o.label}</div>
              <div className="text-base font-semibold mt-1">{o.title}</div>
              <p className="text-sm text-fg-muted mt-2 leading-relaxed">{o.blurb}</p>
              <div className="text-xs text-fg-muted mt-3 pt-3 border-t border-border-muted">
                <span className="font-semibold text-fg-default">언제: </span>{o.whenUseful}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
