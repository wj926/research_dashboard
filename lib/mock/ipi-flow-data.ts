// Hand-curated mock data extracted from /home/dami/wj/Research/StealthyIPIAttack/
// progress/ys/*.md (2026-04-23 to 2026-04-25). Used to prototype "Flow" view
// design candidates. In production this would be LLM-synthesized.

export type FlowEventTone = 'milestone' | 'pivot' | 'result' | 'incident' | 'design' | 'deprecated';

export type FlowEvent = {
  id?: number;             // FlowEvent.id from DB (undefined for mock-only events)
  date: string;            // 'YYYY-MM-DD HH:mm KST'
  source: string;          // progress filename
  title: string;
  tone: FlowEventTone;
  summary: string;         // 1-2 sentences
  bullets?: string[];      // optional key facts
  numbers?: { label: string; value: string }[]; // optional metric badges
  tags?: string[];         // tag IDs (see TAGS below)
  sourceContent?: string;  // full progress.md body (filled at request time)
};

// =====================================================================
// Tag definitions (theme / activity / paper) — 3 그룹
// =====================================================================

export type TagGroup = 'theme' | 'activity' | 'paper';

export type TagDef = {
  id: string;
  group: TagGroup;
  label: string;
  description?: string;
};

export const TAGS: TagDef[] = [
  // -------- theme / 연구 주제 --------
  { id: 'melon-bypass',     group: 'theme', label: 'MELON bypass',     description: 'masked-run dormancy + stop string 회피' },
  { id: 'ipiguard-bypass',  group: 'theme', label: 'IPIGuard bypass',  description: 'reflection 버그 / argument poisoning / DAG 우회' },
  { id: 'trigger-gate',     group: 'theme', label: 'Trigger gate',     description: 'suite-vocab conditional gate 메커니즘' },
  { id: 'authority-framing',group: 'theme', label: 'Authority framing', description: 'PRE-VERIFIED / sysframe / JSON metadata 마커' },
  { id: 'universal-gate',   group: 'theme', label: 'Universal gate',   description: 'suite-agnostic 일반화' },
  { id: 'ablation',         group: 'theme', label: 'Ablation',         description: '축 분리 검증 (gate × marker × extra)' },

  // -------- activity / 작업 종류 --------
  { id: 'code',             group: 'activity', label: 'Code',           description: '새 attack 구현 / 코드 분석' },
  { id: 'experiment',       group: 'activity', label: 'Experiment',     description: '실험 launching / 완주' },
  { id: 'analysis',         group: 'activity', label: 'Analysis',       description: '결과 해석 / 결론 도출' },
  { id: 'paper-writing',    group: 'activity', label: 'Paper writing',  description: '논문 본문 작성' },
  { id: 'survey',           group: 'activity', label: 'Survey',         description: '관련논문 정독 / related work' },
  { id: 'incident',         group: 'activity', label: 'Incident',       description: '디버깅 / 장애 / 인프라 이슈' },

  // -------- paper / 논문 --------
  { id: 'paper:emnlp',      group: 'paper', label: 'EMNLP (defense bypass)' },
  { id: 'paper:icml-ws',    group: 'paper', label: 'ICML Workshop (DAMIAttack)' },
];

export const FLOW_EVENTS: FlowEvent[] = [
  {
    date: '2026-04-23 00:07',
    source: 'progress_20260423_0007.md',
    tone: 'milestone',
    title: '셋업: 두 논문 동시 진행',
    summary:
      'ICML Workshop (DAMIAttack/SDSA — 흔적 없는 dual-success 공격) + EMNLP (defense-bypass 공격론) 두 트랙 시작. IPIGuard 코드 정독 후 취약점 3가지 식별, 39편 관련논문 서베이.',
    bullets: [
      'IPIGuard reflection 코드 버그: argument override',
      'FTI bypass: data-disguised injection',
      'History contamination: depends_on 없을 때 전체 history 노출',
    ],
    tags: ['paper:icml-ws', 'paper:emnlp', 'paper-writing', 'survey', 'ipiguard-bypass', 'code'],
  },
  {
    date: '2026-04-23 11:58',
    source: 'progress_20260423_1158.md',
    tone: 'result',
    title: '핵심 가설 검증: trigger 가 MELON masked-run 우회',
    summary:
      '105-trace representative sample × 4 defense × qwen3-235b 본격 sweep 시작. trigger × MELON 105/105 완주 → masked-run bypass 확인. 동시에 trigger_sysframe (chat-template authority) 런칭.',
    numbers: [
      { label: 'trigger × MELON ASR', value: '0.286' },
      { label: 'masked-run stop hit', value: '0/105' },
    ],
    tags: ['paper:emnlp', 'experiment', 'melon-bypass', 'trigger-gate', 'authority-framing'],
  },
  {
    date: '2026-04-23 15:45',
    source: 'progress_20260423_1545.md',
    tone: 'pivot',
    title: '피벗: trigger_sysframe 폐기 → trigger_fake 설계',
    summary:
      'sysframe A: chat-template 토큰이 masked run 임베딩까지 노출되어 stop hit 25/69, banking ASR 26%로 plain trigger 대비 역전. B 도 9/105 후 중단. 폐기 + 즉시 신규 trigger_fake (one-shot PRE-VERIFIED 마커) 구현 + MELON 런 시작.',
    numbers: [
      { label: 'sysframe A masked stop', value: '36%' },
      { label: 'sysframe banking ASR', value: '26% (vs 48%)' },
    ],
    tags: ['paper:emnlp', 'code', 'melon-bypass', 'authority-framing'],
  },
  {
    date: '2026-04-23 22:51',
    source: 'progress_20260423_2251.md',
    tone: 'result',
    title: 'trigger_fake × MELON 완주: 소폭 lift',
    summary:
      'ASR 30.5% — plain trigger 28.6% 대비 +1.9%p. banking 51.9% (+3.9%p). 다만 MELON stop hit 21/105 (20%) 로 masked bypass 가 부분적으로 깨짐 — PRE-VERIFIED 마커가 임베딩에 노출.',
    numbers: [
      { label: 'trigger_fake × MELON', value: '0.305' },
      { label: 'masked stop hit', value: '20%' },
      { label: 'banking suite', value: '51.9%' },
    ],
    tags: ['paper:emnlp', 'experiment', 'analysis', 'melon-bypass', 'authority-framing', 'incident'],
  },
  {
    date: '2026-04-25 00:12',
    source: 'progress_20260425_0012.md',
    tone: 'design',
    title: '5종 ablation 라운드 설계',
    summary:
      'trigger × marker 2×2 + α 매트릭스로 검증. 신규 5종 (fake_only, fake_metadata, fake_metadata_only, trigger_fake_semantic, fake_both_commit) 구현 + GPU0~5 병렬 런칭. YAML 파싱 incident (큰따옴표 → 작은따옴표) 발견/수정.',
    bullets: [
      'fake_only: trigger 제거, marker 만',
      'fake_metadata: trigger + JSON marker',
      'fake_metadata_only: 둘 다 변경',
      'trigger_fake_semantic: rule → semantic gate',
      'fake_both_commit: trigger_fake + BOTH 강조',
    ],
    tags: ['paper:emnlp', 'code', 'experiment', 'ablation', 'incident'],
  },
  {
    date: '2026-04-25 09:11',
    source: 'progress_20260425_0911.md',
    tone: 'pivot',
    title: '핵심 결론 + 두 번째 피벗: universal trigger',
    summary:
      '5종 모두 trigger_fake 미달. 4-셀 ablation: trigger contribution +0.282, fake contribution +0.015. trigger_fake 의 30.5% 는 사실상 trigger gate 가 만든 결과. fake 방향 종료, trigger 자체의 universal 일반화로 피벗. trigger_universal (anti-MELON-token) + trigger_universal_abstract (pure abstract) 병렬 런칭.',
    numbers: [
      { label: 'baseline (no gate, no fake)', value: '0.004' },
      { label: '+ fake only', value: '0.019' },
      { label: '+ trigger only', value: '0.286' },
      { label: '+ trigger + fake', value: '0.305' },
    ],
    tags: ['paper:emnlp', 'analysis', 'ablation', 'trigger-gate', 'universal-gate', 'experiment'],
  },
];

// =====================================================================
// Status board (Kanban) data
// =====================================================================

export type AttackStatus = 'designed' | 'running' | 'done' | 'deprecated';

export type AttackCard = {
  name: string;
  status: AttackStatus;
  metric?: string;       // e.g. 'MELON 0.305'
  note?: string;         // 1-line context
};

export const ATTACK_BOARD: AttackCard[] = [
  { name: 'trigger',                   status: 'done',       metric: 'MELON 0.286 / IPIGuard 0.093', note: 'masked bypass 100%' },
  { name: 'fake_completion_30x',       status: 'done',       metric: 'MELON 0.276 / no_def 0.314',   note: '30회 반복 fake tool-output' },
  { name: 'chat_inject_qwen3',         status: 'done',       metric: 'IPIGuard 0.051',                note: 'baseline reference' },
  { name: 'trigger_fake',              status: 'done',       metric: 'MELON 0.305 / IPIGuard 0.071',  note: '+1.9%p over plain trigger' },
  { name: 'fake_only',                 status: 'done',       metric: 'MELON 0.019',                   note: 'trigger 필수성 확인' },
  { name: 'fake_metadata',             status: 'done',       metric: 'MELON 0.248',                   note: 'JSON marker form' },
  { name: 'fake_metadata_only',        status: 'done',       metric: 'MELON 0.019',                   note: '2x2 attribution 셀' },
  { name: 'trigger_fake_semantic',     status: 'done',       metric: 'MELON 0.048',                   note: '모호 게이트 실패' },
  { name: 'fake_both_commit',          status: 'done',       metric: 'MELON 0.238',                   note: 'BOTH 강조 무효' },
  { name: 'trigger_universal',         status: 'running',    metric: 'MELON 5/105 (n=5)',             note: 'anti-MELON-token negation (A)' },
  { name: 'trigger_universal_abstract',status: 'running',    metric: '— queued',                      note: 'pure abstract gate (B)' },
  { name: 'trigger_sysframe',          status: 'deprecated', metric: 'banking 26% (vs 48%)',          note: '폐기 — masked bypass 깨짐' },
];

// =====================================================================
// Tree (parent/child of attack lineage). Each node references AttackCard.
// =====================================================================

export type TreeNode = {
  name: string;
  note?: string;
  children?: TreeNode[];
};

export const ATTACK_TREE: TreeNode = {
  name: 'trigger',
  note: 'rule-based suite vocab gate',
  children: [
    {
      name: 'trigger_sysframe',
      note: '✗ deleted — masked bypass broke',
    },
    {
      name: 'trigger_fake',
      note: '◐ +1.9%p, marginal',
      children: [
        { name: 'fake_only',              note: '✗ trigger 필수성 확인' },
        { name: 'fake_metadata',          note: '✗ marker form 영향 미미' },
        { name: 'fake_metadata_only',     note: '✗ baseline 수준' },
        { name: 'trigger_fake_semantic',  note: '✗ 모호 gate 실패' },
        { name: 'fake_both_commit',       note: '✗ BOTH 강조 무효' },
      ],
    },
    {
      name: 'trigger_universal',
      note: '🟡 running — anti-MELON-token (A)',
    },
    {
      name: 'trigger_universal_abstract',
      note: '🟡 running — pure abstract (B)',
    },
  ],
};

// =====================================================================
// Hand-written narrative summary of the round.
// =====================================================================

// =====================================================================
// Phase grouping (chapter view of a long timeline)
// =====================================================================

export type Phase = {
  id: string;
  title: string;
  period: string;
  summary: string;
  outcome: string;
  eventSources: string[];   // matches FlowEvent.source
};

export const PHASES: Phase[] = [
  {
    id: 'p1',
    title: '셋업 + trigger 가설 검증',
    period: '04-23 00:07 → 11:58',
    summary:
      '두 논문 트랙 (ICML Workshop / EMNLP) 확정 + IPIGuard 코드 정독으로 취약점 3개 식별 + 39편 서베이. 105 representative sample × 4 defense sweep 시작.',
    outcome:
      'trigger × MELON 105/105 완주, ASR 0.286, masked-run stop 0/105 → masked-run bypass 가설 확정.',
    eventSources: ['progress_20260423_0007.md', 'progress_20260423_1158.md'],
  },
  {
    id: 'p2',
    title: 'Authority framing 시도 + 첫 피벗',
    period: '04-23 15:45 → 22:51',
    summary:
      'trigger_sysframe (chat-template authority) 시도가 masked bypass 깨짐 + banking ASR 역전으로 폐기. 즉시 trigger_fake (one-shot PRE-VERIFIED) 로 설계 전환.',
    outcome:
      'trigger_fake × MELON 30.5% (+1.9%p over plain trigger). 단 stop hit 20% 로 부분 bypass — marker 가 임베딩에 노출. lift 의 진짜 출처가 불분명.',
    eventSources: ['progress_20260423_1545.md', 'progress_20260423_2251.md'],
  },
  {
    id: 'p3',
    title: '5종 ablation + universal trigger 피벗',
    period: '04-25 00:12 → 09:11',
    summary:
      'gate × marker × Both 직교 축으로 5종 ablation 병렬 (fake_only / fake_metadata / fake_metadata_only / trigger_fake_semantic / fake_both_commit). 4-셀 attribution matrix 로 trigger 단독 vs fake 단독 분리 검증.',
    outcome:
      '5종 모두 trigger_fake 미달. trigger contribution +0.282 vs fake +0.015 → trigger gate 가 lift 의 99%. fake 방향 종료, trigger 의 universal 일반화로 피벗 (trigger_universal A/B 런칭).',
    eventSources: ['progress_20260425_0012.md', 'progress_20260425_0911.md'],
  },
];

// =====================================================================
// Per-attack lifeline (각 공격의 일생 horizontal timeline)
// =====================================================================

export type LifelineMarker = {
  date: string;
  kind: 'designed' | 'running' | 'milestone' | 'done' | 'deprecated';
  note: string;
};

export type AttackLifeline = {
  name: string;
  finalStatus: AttackStatus;
  markers: LifelineMarker[];
};

export const ATTACK_LIFELINES: AttackLifeline[] = [
  {
    name: 'trigger',
    finalStatus: 'done',
    markers: [
      { date: '~04-22', kind: 'designed', note: 'suite-vocab conditional gate' },
      { date: '04-23 11:58', kind: 'milestone', note: 'MELON 105/105 ASR 0.286, stop 0/105' },
      { date: '04-23',  kind: 'done', note: 'IPIGuard 0.093, 기준선 확정' },
    ],
  },
  {
    name: 'trigger_sysframe',
    finalStatus: 'deprecated',
    markers: [
      { date: '04-23 11:58', kind: 'designed', note: 'trigger + chat-template authority' },
      { date: '04-23 15:45', kind: 'milestone', note: 'A: stop 25/69, banking 26%' },
      { date: '04-23 15:45', kind: 'deprecated', note: 'masked bypass 깨짐 → 폐기' },
    ],
  },
  {
    name: 'trigger_fake',
    finalStatus: 'done',
    markers: [
      { date: '04-23 15:45', kind: 'designed', note: 'one-shot PRE-VERIFIED marker' },
      { date: '04-23 22:51', kind: 'milestone', note: 'MELON 0.305 (+1.9%p), stop 21/105' },
      { date: '04-25 00:12', kind: 'milestone', note: '5종 ablation 비교 reference' },
      { date: '04-25 09:11', kind: 'done', note: 'lift 의 출처는 trigger gate 결론' },
    ],
  },
  {
    name: 'fake_only',
    finalStatus: 'done',
    markers: [
      { date: '04-25 00:12', kind: 'designed', note: 'trigger 제거 ablation' },
      { date: '04-25 09:11', kind: 'done', note: 'MELON 0.019 → trigger 필수성 확정' },
    ],
  },
  {
    name: 'fake_metadata',
    finalStatus: 'done',
    markers: [
      { date: '04-25 00:12', kind: 'designed', note: 'JSON marker 변경' },
      { date: '04-25 09:11', kind: 'done', note: 'MELON 0.248, marker form 영향 미미' },
    ],
  },
  {
    name: 'fake_metadata_only',
    finalStatus: 'done',
    markers: [
      { date: '04-25 00:12', kind: 'designed', note: '2x2 attribution 셀 채우기' },
      { date: '04-25 09:11', kind: 'done', note: 'MELON 0.019' },
    ],
  },
  {
    name: 'trigger_fake_semantic',
    finalStatus: 'done',
    markers: [
      { date: '04-25 00:12', kind: 'designed', note: 'rule → semantic gate' },
      { date: '04-25 09:11', kind: 'done', note: 'MELON 0.048 → 모호 gate 실패' },
    ],
  },
  {
    name: 'fake_both_commit',
    finalStatus: 'done',
    markers: [
      { date: '04-25 00:12', kind: 'designed', note: 'BOTH 강조 문단 추가' },
      { date: '04-25 09:11', kind: 'done', note: 'MELON 0.238, BOTH 강조 무효' },
    ],
  },
  {
    name: 'trigger_universal',
    finalStatus: 'running',
    markers: [
      { date: '04-25 09:11', kind: 'designed', note: 'anti-MELON-token negation (A)' },
      { date: '04-25 09:11', kind: 'running', note: 'GPU0, MELON 5/105 ASR 0.200 (n=5, no signal)' },
    ],
  },
  {
    name: 'trigger_universal_abstract',
    finalStatus: 'running',
    markers: [
      { date: '04-25 09:11', kind: 'designed', note: 'pure abstract gate (B)' },
      { date: '04-25 09:11', kind: 'running', note: 'GPU1, queued' },
    ],
  },
];

// =====================================================================
// Task-grouped view (short/mid/long term goals → events that contributed)
// =====================================================================

export type TaskBucket = 'short' | 'mid' | 'long';
export type TaskStatus = 'pending' | 'in_progress' | 'done';

export type TaskItem = {
  id: string;
  bucket: TaskBucket;
  title: string;
  status: TaskStatus;
  goal: string;                 // 1-line "왜" 설명 (subtask 가 없을 때 카드 부제로)
  subtasks?: string[];          // 있으면 카드 부제가 bullet list 로 (1줄당 한 항목)
  eventSources: string[];       // matches FlowEvent.source
};

export const TASKS: TaskItem[] = [
  // -------- SHORT (이번 라운드 ~ 이번 주) --------
  {
    id: 't-trigger-fake-sweep',
    bucket: 'short',
    status: 'done',
    title: 'trigger_fake × 4-defense 105 sweep',
    goal: 'one-shot PRE-VERIFIED 마커가 trigger 단독 대비 ASR 을 끌어올리는지 검증',
    eventSources: ['progress_20260423_1545.md', 'progress_20260423_2251.md'],
  },
  {
    id: 't-ablation-5',
    bucket: 'short',
    status: 'done',
    title: '5종 ablation × MELON 105 sweep',
    goal: 'trigger_fake 의 lift 가 trigger gate 덕인지 marker 덕인지 분리',
    subtasks: [
      'fake_only / fake_metadata / fake_metadata_only',
      'trigger_fake_semantic / fake_both_commit',
    ],
    eventSources: ['progress_20260425_0012.md', 'progress_20260425_0911.md'],
  },
  {
    id: 't-universal-launch',
    bucket: 'short',
    status: 'in_progress',
    title: 'trigger_universal A/B × MELON 105 완주',
    goal: 'suite-vocab hardcode 제거. universal gate 가 plain trigger ASR 0.286 을 유지/초과하는지',
    subtasks: [
      'A: anti-MELON-token negation',
      'B: pure abstract gate',
    ],
    eventSources: ['progress_20260425_0911.md'],
  },

  // -------- MID (이번 달) --------
  {
    id: 't-emnlp-attack-decide',
    bucket: 'mid',
    status: 'in_progress',
    title: 'EMNLP attack 섹션 최종안 결정',
    goal: 'trigger / trigger_fake / trigger_universal 중 논문에 올릴 메인 공격 + 보조 ablation 구성',
    eventSources: ['progress_20260423_2251.md', 'progress_20260425_0012.md', 'progress_20260425_0911.md'],
  },
  {
    id: 't-arg-poisoning-poc',
    bucket: 'mid',
    status: 'pending',
    title: 'IPIGuard argument poisoning PoC',
    goal: '3-axis 공격론을 코드로 구현, IPIGuard 우회 demo',
    subtasks: [
      'data-disguised injection',
      'history contamination via depends_on',
      'node expansion → poisoning chain',
    ],
    eventSources: ['progress_20260423_0007.md'],
  },
  {
    id: 't-related-work-survey',
    bucket: 'mid',
    status: 'in_progress',
    title: '관련논문 5편 정독 + related work 구성',
    goal: 'AdaptiveAttacks / DemonAgent / AdapTools / Log-To-Leak / AttriGuard. EMNLP related work 의 baseline framing',
    eventSources: ['progress_20260423_0007.md'],
  },

  // -------- LONG (분기/제출) --------
  {
    id: 't-emnlp-submission',
    bucket: 'long',
    status: 'in_progress',
    title: 'EMNLP 2026 논문 제출',
    goal: 'defense-bypass 공격론 (trigger universal + argument poisoning) 통합 논문',
    eventSources: ['progress_20260423_0007.md', 'progress_20260423_2251.md', 'progress_20260425_0911.md'],
  },
  {
    id: 't-icml-workshop-v4',
    bucket: 'long',
    status: 'in_progress',
    title: 'ICML Workshop DAMIAttack v4',
    goal: 'SDSA + DAMIAttack: dual-success + 흔적 없는 공격. 실험 placeholder 채우고 v4 완성',
    eventSources: ['progress_20260423_0007.md'],
  },
];

export const NARRATIVE = `**이번 라운드 (04-23 → 04-25) 한 줄**: PRE-VERIFIED authority framing 으로 trigger 효과를 더 끌어올리려 했으나, 5종 ablation 결과 lift 의 99% 는 trigger gate 자체에서 나온다는 결론에 도달. fake 방향을 종료하고 trigger 의 universal 일반화로 피벗.

**무엇을 했나**. MELON / IPIGuard / tool_filter / no_defense 4축 위에서 qwen3-235b × 105-sample representative 로 \`trigger\`, \`trigger_sysframe\`, \`trigger_fake\` 를 순차 평가. trigger 단독은 MELON masked-run bypass 100% (stop hit 0/105) 로 ASR 0.286. authority framing 추가 시도 두 갈래 — sysframe (chat-template) 은 masked bypass 가 깨져서 폐기, fake (one-shot PRE-VERIFIED) 는 0.305 로 소폭 lift.

**무엇을 발견했나**. 0.305 의 lift 가 marker 덕인지 trigger 덕인지 분리 검증을 위해 5종 ablation (gate × marker × Both 강조 직교 축) 을 병렬 실행. 결과: 5종 모두 trigger_fake 미달, fake 단독은 0.019 에 그침. **trigger gate 가 lift 의 거의 전부 (+0.282 vs +0.015)**. IPIGuard 에서는 fake 가 오히려 -2.2%p 손해 — fake 효과는 MELON-specific.

**다음 무엇을 하나**. fake 방향 종료. 현재의 \`_SUITE_TRIGGERS\` 하드코드 dict (banking/slack/travel/workspace 별 vocab) 는 suite-specific + defense-specific 가정이라 논문의 "universal" 주장에 약점. 두 후보 — \`trigger_universal\` (anti-MELON-token negation, A) + \`trigger_universal_abstract\` (pure abstract, defense-agnostic, B) — GPU0/1 병렬 런칭. 105 완주 후 plain trigger 0.286 와 비교가 1차 판정.`;
