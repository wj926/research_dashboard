---
name: labhub-flow-ingest
description: Pulls latest progress + wiki from a research project's git repo, mirrors wiki entities into LabHub DB, and uses LLM to extract FlowEvents (date/title/summary/tone/bullets/numbers/tags) + classify them into existing project tasks (TodoItem). For LabHub Flow J view auto-population. Trigger keywords - "wiki ingest", "labhub ingest", "labhub-flow-ingest", "flow ingest", "<project> 의 progress 정리해서 LabHub 에 올려"
---

# labhub-flow-ingest

LabHub 의 Flow J view (Task Kanban + event timeline) 가 자동으로 채워지게 하는 skill. 한 프로젝트의 progress 파일들을 git 에서 가져와 LabHub DB 에 정리한다.

## When to invoke

- 사용자가 "wiki ingest", "labhub ingest", "flow 정리", "progress 정리" 등을 말했을 때
- 인자 (없으면 사용자에게 물어볼 것):
  - **project slug** (필수). 예: `ipi-attack`. LabHub Project 테이블의 `slug`.
  - **--force** (선택). 기존에 ingested 된 source 도 재처리.

## Hard requirements

1. CWD 는 LabHub repo 여야 함: `/home/dami/wj/research_dashboard`. CLI 가 `prod.db` 를 cwd-relative path 로 찾기 때문.
2. **Project 의 `githubRepo` 가 DB 에 설정돼있어야 함** ("owner/repo" 형식, 필수). 없으면 CLI 즉시 에러. 사용자에게:
   ```
   이 프로젝트의 githubRepo 가 설정 안 돼있어요. 먼저:
   - LabHub UI 에서 프로젝트 편집 → "GitHub repo" 설정
   - 또는 SQL: UPDATE Project SET githubRepo='owner/repo' WHERE slug='<slug>';
   ```
3. **localPath 는 선택**. 없으면 CLI 가 자동으로 `/home/dami/wj/Research/<repo-name>` 에 clone. 이미 있으면 그걸 사용.
4. 사용자가 invoke 할 때 cwd 가 다른 곳이면 먼저 `cd /home/dami/wj/research_dashboard` 실행.

## Procedure (in order)

### Step 1 — Get project metadata
```bash
pnpm tsx scripts/flow-ingest-cli.ts get-project --slug <SLUG>
```
출력 (JSON):
- `project.localPath` — git checkout 위치 (예: `/home/dami/wj/Research/StealthyIPIAttack`)
- `tasks[]` — 현재 등록된 TodoItem 목록 (id, bucket, title, goal, subtasks, status). LLM 이 task 매핑 시 참고.
- `wikiTypes[]` — 현 프로젝트의 wiki 분류 (이번 V1 에서는 mirror 만 하므로 정보용).
- `ingestedSources[]` — 이미 처리된 progress 파일명 목록.

### Step 2 — git pull (원격 따라잡기)
```bash
cd <project.localPath>
git pull --ff-only
```
- 충돌이나 non-ff 면 멈추고 사용자에게 보고.
- StealthyIPIAttack 같이 read-only mirror 면 정상 ff 됨.
- `cd` 후에는 LabHub repo 로 다시 돌아올 것: `cd /home/dami/wj/research_dashboard`.

### Step 3 — Wiki 미러 (V1: 단순 재 import)
```bash
pnpm tsx scripts/import-stealthy-wiki.ts
```
- 현재는 ipi-attack 전용 하드코딩 스크립트. 다른 프로젝트는 V2 에서.
- git `wiki/{attacks,defenses,concepts,findings}/*.md` → LabHub `WikiEntity` 테이블 mirror.
- 기존 entity 다 삭제 후 다시 생성 (idempotent).

### Step 4 — 새 progress 파일 식별
```bash
pnpm tsx scripts/flow-ingest-cli.ts list-new-progress --slug <SLUG>
```
출력: `files[]` 각각 `{ path, source, ingested }`. `--force` 안 쓰면 `ingested=false` 만 처리.

### Step 5 — 각 새 progress 파일 LLM 추출 + apply

**중요: 한 progress 파일 안에 별개 활동이 여러 개면 N 개 event 로 분할.**

분할 기준:
- 서로 다른 task / 연구 라인을 다루는 활동 (예: "공격 X 새 구현" + "다른 모델 4개 cross-eval")
- tone 이 자연스럽게 다른 활동 (예: 한 progress 안에 result + design 동시에)
- 본문에서 명확히 다른 섹션으로 구분되어 있음

분할 안 하는 경우:
- 같은 task 의 연속 (sweep 진행 → 완주 → 분석)
- 한 활동의 부수 효과 (실험 + 거기서 나온 incident)

분할 시 각 event 는:
- 같은 source (progress 파일명) 공유
- 다른 title / summary / tone / numbers / tags
- 각자 독립적으로 task 매핑 (같은 task 일 수도, 다른 task 일 수도)

각 event 마다 `apply` CLI 한 번 호출. (overwrite=false 로 둬서 누적, 이미 있는 source 라도 새 event 추가됨.)

각 파일에 대해 반복:

#### 5a. Read tool 로 본문 읽기
```
Read /home/dami/wj/Research/StealthyIPIAttack/progress/ys/progress_YYYYMMDD_HHMM.md
```

#### 5b. (LLM, 본인이 직접) 다음 schema 로 추출

```json
{
  "projectSlug": "<SLUG>",
  "event": {
    "date": "YYYY-MM-DD HH:mm",
    "source": "progress_YYYYMMDD_HHMM.md",
    "title": "<짧은 제목, 한글 OK, 30자 안쪽>",
    "summary": "<2-3문장 요약>",
    "tone": "milestone | result | pivot | deprecated | design | incident",
    "bullets": ["<짧은 사실 1>", "<짧은 사실 2>", ...],
    "numbers": [{"label": "MELON ASR", "value": "0.305"}, ...],
    "tags": ["<tag-id>", ...]
  },
  "task": { "kind": "existing", "id": <todoId> }
       OR { "kind": "new", "bucket": "short", "title": "<task 이름>", "goal": "<왜>", "subtasks": [], "status": "in_progress" }
       OR null,
  "overwrite": false
}
```

#### Tone taxonomy (정확히 하나 선택)

- `milestone` — 셋업, 신규 도구 도입, 큰 변화의 시작 (예: "두 논문 트랙 셋업", "GPU 인프라 구축")
- `result` — 완주된 실험의 결과 (예: "trigger × MELON 105/105 ASR 0.286")
- `pivot` — 방향 전환 + 새 방향 명시 (예: "sysframe 폐기 → trigger_fake 설계")
- `deprecated` — 방법 자체를 버림, 다음 방향 미정 (예: "transformer prober 가능성 없음 — 종료". `pivot` 과의 차이는 새 방향이 같은 progress 안에 없음)
- `design` — 새 실험/공격/구조 설계 단계 (예: "5종 ablation 라운드 설계")
- `incident` — 디버깅, 장애, 잘못 발견 후 수정 (예: "YAML 파싱 버그", "OOM")

여러 tone 이 섞여있을 땐 **그 progress 의 가장 핵심적인 변화** 를 선택.

#### Title 작성 가이드
- 30자 안쪽
- 결과면 핵심 수치 포함 (예: "trigger_fake × MELON 0.305")
- 피벗이면 "X 폐기 → Y 설계" 형태
- 한글/영어 자유, 고유명사 (attack/defense 이름) 그대로

#### Summary 작성 가이드
- 2-3 문장
- "무엇을 했나" + "결과/의미"
- progress 본문의 Context 섹션 + 핵심 결론 종합

#### Bullets 추출
- 본문에 명시된 짧은 사실들 (한 줄 fact, 한 항목)
- 보통 3-5개. progress 의 "Done" 섹션에서 추출.
- bullets 가 의미 없는 progress 는 빈 배열 또는 omit.

#### Numbers 추출
- 본문 표/수치에서 가장 중요한 metric 들 1-4개
- format: `{"label": "<짧은 metric 이름>", "value": "<수치 문자열>"}`
- 예: `{"label": "trigger_fake × MELON ASR", "value": "0.305"}`
- 표/수치 없는 progress 는 omit.

#### Tags 부여 (옵션 — 현재 frontend 에서 사용 안 하지만 미래 대비)
- 일반적인 tag 카테고리 (theme): `melon-bypass`, `ipiguard-bypass`, `trigger-gate`, `authority-framing`, `universal-gate`, `ablation`
- activity: `code`, `experiment`, `analysis`, `paper-writing`, `survey`, `incident`
- paper: `paper:emnlp`, `paper:icml-ws`
- 적합한 거 3-5개 선택. omit 가능.

#### Task 매핑 (정확히 1개 또는 새 task 생성)

**원칙**: 한 progress = 한 task 의 다음 진척. 학생이 보통 단기 라운드의 한 가지 일을 하고 progress 를 적기 때문.

step 1 의 `tasks[]` 와 progress 의 핵심 활동을 비교. **가장 잘 맞는 1 개** 의 task id 선택.

선택 기준:
- progress 의 핵심 작업이 task title / goal / subtasks 에 직접 언급됨
- progress 가 그 task 의 **연속선상의 다음 step** 으로 읽힘
- 여러 후보가 있으면 "이 progress 의 가장 큰 활동" 기준으로 1 개

**기존 task 중 적합한 게 없으면** `{ "kind": "new", ... }` 로 새로 생성:
- bucket: 보통 `short` (이번 라운드의 새 일). 명시적으로 큰 그림 (논문 섹션 결정, 분기 마감) 이면 `mid` 또는 `long`.
- title: progress 핵심 활동의 한 문장 (예: "trigger_v3 implementation + 105 sweep")
- goal: 1줄 "왜" (예: "trigger_v2 의 OOM 문제 해결을 위한 새 구조")
- **group** (epic / 큰 묶음): step 1 의 `tasks[].group` 에서 같은 epic 이 이미 있으면 그 string 재사용. 없으면 새 group 만들기 가능 (보수적으로 — 이미 비슷한 게 있는지 먼저 보기).
  - 예: 기존 task 들이 group="MELON 우회 공격 탐색" 인데 새 trigger 변종 task 만든다면 같은 group 재사용
  - 예: 새 분야 (예: "Defense landscape 측정") 시작이면 새 group 만들기
- **subtasks** (선택, 최대 2개): 이 task 가 **무엇을 하는 task 인지** 짧게 묘사. 목적 / 검증할 가설 / 큰 그림.
  - ✅ 좋음: "repetition 횟수 단독으로 MELON 우회 가능한지 검증", "32b → 235b 전이성 측정"
  - ❌ 나쁨: "qwen3:235b N=30 105/105 완주 ASR 0.711" (수치/진행사항 — 카드 아래 events 에서 자동으로 보임)
  - ❌ 나쁨: "qwen3:32b N ∈ {10,20,30,40,50} 완주" (실험 plan 의 구체값 — events 에서 보임)
  - ❌ 나쁨: 3개 이상 (UI 가 2개만 표시. 너무 많으면 큰 그림 안 보임)
  - 1~2개로 task 의 "왜" "뭐를 알고 싶은지" 만 표현
- status: 보통 `in_progress` (진행 중인 일이 progress 에 적힘). 완주된 결과면 `done`.

**중요 — group 재사용 우선**: task 가 너무 잘게 쪼개져 단기 컬럼이 빽빽해지는 것을 막기 위해, **이미 있는 group 안에 새 task 를 넣는 것을 선호**. 새 group 은 정말 새 라인일 때만.

예시 1 — progress 가 "5종 ablation 결과" + 기존에 "t-ablation-5" task 있음
→ `{ "kind": "existing", "id": <t-ablation-5 id> }`

예시 2 — progress 가 "trigger_v3 신규 설계 + 첫 런칭" + 기존 task 에 trigger_v3 무관
→ `{ "kind": "new", "bucket": "short", "title": "trigger_v3 design + 105 sweep", "goal": "v2 의 OOM 해결 + universal gate 다음 시도", "status": "in_progress" }`

**`task: null` 은 거의 안 씀** — uncategorized 가 많아지면 의미 없음. 정말 어디에도 안 맞고 새로 만들기도 애매할 때만 (예: lab admin 같은 이벤트).

#### 5c. JSON 을 CLI 에 stdin 으로 전달

```bash
echo '<JSON>' | pnpm tsx scripts/flow-ingest-cli.ts apply
```

또는 heredoc:
```bash
pnpm tsx scripts/flow-ingest-cli.ts apply <<'EOF'
{
  "projectSlug": "ipi-attack",
  "event": { ... },
  "task": { "kind": "existing", "id": 14 },
  "overwrite": false
}
EOF
```

성공 응답 (JSON): `{"ok": true, "eventId": <id>, "mode": "created"|"updated", "taskId": <id|null>, "taskCreated": <bool>, "linkCreated": <bool>}`

**실패 시** (예: 검증 에러, task ID 없음) 은 stderr 로 메시지 + exit 1. **그 progress 만 skip 하고 다음으로 진행**, 끝에 사용자에게 보고.

### Step 6 — 요약 보고

마지막에 사용자에게 출력:
- 처리한 progress 개수
- 각 progress 의 title + tone + 매핑된 tasks (개수 또는 짧은 목록)
- 실패한 것 있으면 사유와 함께
- "labhub2.damilab.cc/projects/<slug>/flow/j 에서 확인" 링크

## Failure modes

| 에러 | 대처 |
|---|---|
| Project 에 localPath 없음 | 사용자에게 LabHub UI 또는 SQL 로 설정하라 안내 |
| `git pull --ff-only` 실패 (non-ff) | 진행 중단, 사용자에게 git 상태 확인 요청 |
| `apply` 가 task ID 없음 에러 | 그 progress 의 taskIds 를 빼고 재시도, 또는 skip |
| `apply` 가 tone 검증 실패 | tone 다시 결정 후 재시도 |
| 같은 source 가 이미 있음 (overwrite=false) | --force 안 줬으면 skip 정상. 예상된 동작 |

## Cost / quota notes

- progress 1개 = ~5K tokens (본문 + task 목록 컨텍스트). Claude Max plan 의 quota 에서 처리됨, 추가 API 요금 없음.
- 6개 progress batch = ~1-2분 소요.
- 동시 호출 금지 (Claude 세션 직렬). V2 에서 LabHub UI 연결 시 lock 필요.

## V2 (이후 계획)

- LabHub UI 의 "Refresh from git" 버튼이 이 skill 을 `claude --print` 로 spawn
- SSE 스트리밍 + 진행률 표시
- Wiki ingest 를 본격 LLM 으로 (StealthyIPIAttack 외 프로젝트도)
- 자동 re-ingest 옵션 (cron)

## V3+ (먼 미래)

- 여러 프로젝트 동시 ingest
- 사용자별 "마지막 본 시각" 로 New! 배지 동작
- LLM 이 task status 자동 갱신 추천 (사람 승인 후 적용)
