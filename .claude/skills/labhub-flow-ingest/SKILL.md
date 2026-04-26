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
2. **Project 의 `githubRepo` AND `localPath` 둘 다 DB 에 설정돼있어야 함.** 없으면 CLI 가 즉시 에러로 종료. 사용자에게 안내:
   ```
   이 프로젝트는 GitHub 추적이 설정 안 돼있어요. 먼저:
   - LabHub UI 에서 프로젝트 편집 → "GitHub repo" + "Local path" 설정
   - 또는 SQL: UPDATE Project SET githubRepo='owner/repo', localPath='/abs/path' WHERE slug='<slug>';
   ```
3. 사용자가 invoke 할 때 cwd 가 다른 곳이면 먼저 `cd /home/dami/wj/research_dashboard` 실행.

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
    "tone": "milestone | result | pivot | design | incident",
    "bullets": ["<짧은 사실 1>", "<짧은 사실 2>", ...],
    "numbers": [{"label": "MELON ASR", "value": "0.305"}, ...],
    "tags": ["<tag-id>", ...]
  },
  "taskIds": [<id>, <id>, ...],
  "overwrite": false
}
```

#### Tone taxonomy (정확히 하나 선택)

- `milestone` — 셋업, 신규 도구 도입, 큰 변화의 시작 (예: "두 논문 트랙 셋업", "GPU 인프라 구축")
- `result` — 완주된 실험의 결과 (예: "trigger × MELON 105/105 ASR 0.286")
- `pivot` — 방향 전환, 가설 폐기 (예: "sysframe 폐기 → trigger_fake 설계")
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

#### Task 매핑 (taskIds)

step 1 의 `tasks[]` 와 progress 본문을 비교. **이 progress 가 어느 task 들을 진척시키는가** 판단.

기준:
- task title / goal / subtasks 에 언급된 것이 progress 에 등장하면 매핑
- progress 가 한 task 만 다루는 경우도 있고 (1개), 여러 task 에 걸친 경우도 있음 (2-3개). 보통 **2-3개**가 적정.
- 매핑 안 되는 task 는 빼기 (false positive 가 더 나쁨)

예시 — progress 가 "5종 ablation 결과 + universal trigger 피벗" 이고 tasks 가:
- `t-ablation-5` (5종 ablation × MELON 105 sweep) → ✅ 매핑 (직접 결과)
- `t-universal-launch` (trigger_universal A/B 완주) → ✅ 매핑 (이번 progress 에서 런칭)
- `t-emnlp-attack-decide` (EMNLP attack 섹션 최종안 결정) → ✅ 매핑 (이번 결정이 다음 단계 영향)
- `t-arg-poisoning-poc` (IPIGuard argument poisoning PoC) → ❌ 무관

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
  "taskIds": [13, 14, 16],
  "overwrite": false
}
EOF
```

성공 응답 (JSON): `{"ok": true, "eventId": <id>, "mode": "created"|"updated", "taskLinks": <count>}`

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
