# Research Dashboard UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a navigable 5-page GitHub-styled research dashboard (LabHub) populated with static mock data, ready for later backend integration.

**Architecture:** Next.js 15 App Router SPA with nested-route tabs. A static mock-data layer under `lib/mock/*` feeds all pages via typed interfaces in `lib/types.ts`; pages import helper queries from `lib/mock/index.ts`. Visual style uses Primer color tokens in Tailwind. Interactivity is minimal (tab navigation, Kanban drag-and-drop that updates local state only). Playwright smoke tests verify every route renders.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 3, shadcn/ui (dropdown-menu only), `@primer/octicons-react`, `react-markdown` + `remark-gfm`, `@dnd-kit/core`, Playwright.

---

## File Structure

```
app/
  layout.tsx                 # Root layout: TopNav + <main>
  page.tsx                   # Dashboard (A)
  projects/
    page.tsx                 # Projects index
    [slug]/
      layout.tsx             # ProjectHeader + TabBar
      page.tsx               # Overview
      experiments/page.tsx
      papers/page.tsx
      data/page.tsx
      members/page.tsx
  pipeline/page.tsx          # Kanban (E)
  experiments/
    page.tsx                 # Global runs list (F)
    [id]/page.tsx            # Run detail stub
  discussions/
    page.tsx                 # List (H)
    [id]/page.tsx            # Thread detail
  members/[login]/page.tsx   # Member stub
  globals.css
components/
  nav/TopNav.tsx
  shell/PageShell.tsx
  project/ProjectCard.tsx ProjectHeader.tsx TabBar.tsx
  feed/ActivityFeedItem.tsx
  badges/StatusBadge.tsx LabelChip.tsx
  people/Avatar.tsx AvatarStack.tsx
  kanban/KanbanBoard.tsx KanbanColumn.tsx KanbanCard.tsx
  runs/RunRow.tsx
  discussions/DiscussionRow.tsx
  md/MarkdownBody.tsx
  misc/DeadlineList.tsx EmptyState.tsx
  ui/dropdown-menu.tsx       # shadcn-generated
lib/
  types.ts
  cn.ts                      # clsx + tailwind-merge
  mock/
    members.ts projects.ts papers.ts experiments.ts
    discussions.ts releases.ts events.ts venues.ts
    index.ts
  theme/tokens.ts
tests/
  data-integrity.spec.ts     # Playwright: Node runner for mock invariants
  smoke/*.spec.ts            # One per route
playwright.config.ts
tailwind.config.ts
tsconfig.json
next.config.ts
package.json
```

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.eslintrc.json`

- [ ] **Step 1: Initialize Next.js app in-place**

Run: `cd /home/dgu/research_dashboard && pnpm dlx create-next-app@latest . --ts --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm --no-turbo --yes`

Expected: Creates Next.js scaffold. May refuse if directory non-empty — if so, move existing files temporarily:

```bash
mv docs .gitignore /tmp/preserve-$$
pnpm dlx create-next-app@latest . --ts --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm --no-turbo --yes
mv /tmp/preserve-$$/* /tmp/preserve-$$/.gitignore .
rmdir /tmp/preserve-$$
```

- [ ] **Step 2: Verify dev server starts**

Run: `pnpm dev` (in background), then `curl -s http://localhost:3000 | head -c 200`
Expected: HTML containing "Next.js" or default landing page markup.

Kill dev server after verification.

- [ ] **Step 3: Install remaining runtime dependencies**

Run:
```bash
pnpm add @primer/octicons-react react-markdown remark-gfm @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities clsx tailwind-merge class-variance-authority @radix-ui/react-dropdown-menu
```

Expected: installs without errors.

- [ ] **Step 4: Install dev dependencies (Playwright)**

Run:
```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

Expected: Chromium downloads successfully.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "scaffold Next.js app with base dependencies"
```

---

## Task 2: Configure Tailwind with Primer color tokens

**Files:**
- Modify: `tailwind.config.ts`
- Create: `lib/theme/tokens.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Create token source of truth**

Create `lib/theme/tokens.ts`:
```ts
export const colors = {
  canvas: {
    default: '#ffffff',
    subtle: '#f6f8fa',
    inset: '#eaeef2',
  },
  fg: {
    default: '#1f2328',
    muted: '#656d76',
    subtle: '#6e7781',
    onEmphasis: '#ffffff',
  },
  border: {
    default: '#d0d7de',
    muted: '#d8dee4',
  },
  accent: { fg: '#0969da', emphasis: '#0969da', subtle: '#ddf4ff' },
  success: { fg: '#1a7f37', emphasis: '#1f883d', subtle: '#dafbe1' },
  danger:  { fg: '#cf222e', emphasis: '#cf222e', subtle: '#ffebe9' },
  attention: { fg: '#9a6700', emphasis: '#bf8700', subtle: '#fff8c5' },
  done:    { fg: '#8250df', emphasis: '#8250df', subtle: '#fbefff' },
  neutral: { emphasis: '#6e7781', subtle: '#eaeef2' },
} as const;
```

- [ ] **Step 2: Wire tokens into Tailwind config**

Replace `tailwind.config.ts` with:
```ts
import type { Config } from 'tailwindcss';
import { colors } from './lib/theme/tokens';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: colors.canvas,
        fg: colors.fg,
        'border-default': colors.border.default,
        'border-muted': colors.border.muted,
        accent: colors.accent,
        success: colors.success,
        danger: colors.danger,
        attention: colors.attention,
        done: colors.done,
        neutral: colors.neutral,
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['14px', '20px'],
        lg: ['16px', '24px'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Rewrite globals.css**

Replace `app/globals.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}
body {
  background: #ffffff;
  color: #1f2328;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 20px;
}
```

- [ ] **Step 4: Create cn helper**

Create `lib/cn.ts`:
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Verify tsc passes**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "add Primer color tokens and Tailwind theme"
```

---

## Task 3: Playwright smoke-test harness

**Files:**
- Create: `playwright.config.ts`, `tests/smoke/home.spec.ts`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Create Playwright config**

Create `playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'pnpm dev --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 2: Write failing smoke test for home**

Create `tests/smoke/home.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('/ renders without error and shows top nav', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('banner')).toBeVisible();
});
```

- [ ] **Step 3: Add test scripts to package.json**

Edit `package.json` scripts section to include:
```json
"test": "playwright test",
"test:smoke": "playwright test tests/smoke",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 4: Run the smoke test (expect failure — no banner yet)**

Run: `pnpm test tests/smoke/home.spec.ts`
Expected: FAIL — `<header role="banner">` not found. This confirms the test is wired up and meaningful.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "add Playwright smoke-test harness with failing home test"
```

---

## Task 4: Define domain types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write type definitions**

Create `lib/types.ts`:
```ts
export type Slug = string;
export type UserLogin = string;

export type PaperStage = 'idea' | 'experiments' | 'writing' | 'review' | 'published';
export type RunStatus = 'success' | 'failure' | 'in_progress' | 'queued' | 'cancelled';
export type MemberRole = 'PI' | 'Postdoc' | 'PhD' | 'MS' | 'Intern' | 'Alumni';
export type DiscussionCategory = 'announcements' | 'journal_club' | 'qa' | 'ideas';
export type ReleaseKind = 'dataset' | 'tool' | 'skill' | 'model';
export type EventType = 'paper' | 'experiment' | 'release' | 'discussion' | 'project';
export type VenueKind = 'abstract' | 'full' | 'camera_ready' | 'rebuttal';

export interface Project {
  slug: Slug;
  name: string;
  description: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  memberLogins: UserLogin[];
  repos: { label: string; url: string }[];
  paperIds: string[];
  releaseIds: string[];
}

export interface Paper {
  id: string;
  title: string;
  authorLogins: UserLogin[];
  projectSlug: Slug;
  stage: PaperStage;
  venue?: string;
  deadline?: string;
  draftUrl?: string;
  pdfUrl?: string;
}

export interface ExperimentRun {
  id: string;
  name: string;
  projectSlug: Slug;
  status: RunStatus;
  startedAt: string;
  durationSec?: number;
  triggeredByLogin: UserLogin;
  summary?: string;
  stepsMock?: { name: string; status: RunStatus; logSnippet?: string }[];
}

export interface Member {
  login: UserLogin;
  displayName: string;
  role: MemberRole;
  avatarUrl?: string;
  bio?: string;
  pinnedProjectSlugs: Slug[];
}

export interface Discussion {
  id: string;
  category: DiscussionCategory;
  title: string;
  authorLogin: UserLogin;
  createdAt: string;
  lastActivityAt: string;
  replyCount: number;
  bodyMarkdown: string;
  replies: { authorLogin: UserLogin; createdAt: string; bodyMarkdown: string }[];
}

export interface Release {
  id: string;
  name: string;
  kind: ReleaseKind;
  projectSlug: Slug;
  version: string;
  publishedAt: string;
  description?: string;
  downloadUrl?: string;
}

export interface ActivityEvent {
  id: string;
  type: EventType;
  actorLogin: UserLogin;
  projectSlug?: Slug;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Venue {
  id: string;
  name: string;
  deadline: string;
  kind: VenueKind;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "define domain types for research dashboard"
```

---

## Task 5: Mock data — members

**Files:**
- Create: `lib/mock/members.ts`

- [ ] **Step 1: Seed 12 members**

Create `lib/mock/members.ts`:
```ts
import type { Member } from '@/lib/types';

export const members: Member[] = [
  { login: 'sooyoung', displayName: 'Prof. Kim Soo-young', role: 'PI', bio: 'LLM reasoning, alignment, evaluation.', pinnedProjectSlugs: ['reasoning-bench-v2', 'alignment-probes'] },
  { login: 'haneul', displayName: 'Dr. Park Ha-neul', role: 'Postdoc', bio: 'Long-context models and retrieval.', pinnedProjectSlugs: ['long-context-eval'] },
  { login: 'yeji', displayName: 'Dr. Lee Ye-ji', role: 'Postdoc', bio: 'Agentic tool use, code generation.', pinnedProjectSlugs: ['agentic-tool-use', 'claude-skill-suite'] },
  { login: 'dgu', displayName: 'Dongyu', role: 'PhD', bio: 'Claude Code skills, research tooling.', pinnedProjectSlugs: ['claude-skill-suite'] },
  { login: 'jihoon', displayName: 'Jihoon', role: 'PhD', bio: 'Reasoning depth benchmarks.', pinnedProjectSlugs: ['reasoning-bench-v2'] },
  { login: 'minji', displayName: 'Minji', role: 'PhD', bio: 'Context-length evaluation.', pinnedProjectSlugs: ['long-context-eval'] },
  { login: 'sungmin', displayName: 'Sungmin', role: 'PhD', bio: 'Alignment failure modes.', pinnedProjectSlugs: ['alignment-probes'] },
  { login: 'jiwoo', displayName: 'Jiwoo', role: 'PhD', bio: 'Korean reasoning datasets.', pinnedProjectSlugs: ['KoLogicQA'] },
  { login: 'taehyun', displayName: 'Taehyun', role: 'PhD', bio: 'Agentic evaluation environments.', pinnedProjectSlugs: ['agentic-tool-use'] },
  { login: 'nari', displayName: 'Nari', role: 'MS', bio: 'Dataset pipelines.', pinnedProjectSlugs: ['KoLogicQA'] },
  { login: 'junho', displayName: 'Junho', role: 'MS', bio: 'Eval infrastructure.', pinnedProjectSlugs: ['reasoning-bench-v2'] },
  { login: 'eunseo', displayName: 'Eunseo', role: 'Intern', bio: 'Summer intern — tool use.', pinnedProjectSlugs: ['agentic-tool-use'] },
];
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/mock/members.ts
git commit -m "add mock member data (12 lab members)"
```

---

## Task 6: Mock data — projects

**Files:**
- Create: `lib/mock/projects.ts`

- [ ] **Step 1: Seed 6 projects**

Create `lib/mock/projects.ts`:
```ts
import type { Project } from '@/lib/types';

export const projects: Project[] = [
  {
    slug: 'reasoning-bench-v2',
    name: 'reasoning-bench-v2',
    description: 'Probing depth of multi-step reasoning across frontier LLMs.',
    tags: ['LLM', 'benchmark', 'reasoning'],
    pinned: true,
    createdAt: '2025-09-10T00:00:00Z',
    updatedAt: '2026-04-22T08:00:00Z',
    memberLogins: ['sooyoung', 'jihoon', 'junho'],
    repos: [{ label: 'GitHub', url: 'https://github.com/example/reasoning-bench-v2' }],
    paperIds: ['p-001', 'p-002'],
    releaseIds: ['r-001'],
  },
  {
    slug: 'claude-skill-suite',
    name: 'claude-skill-suite',
    description: 'Open-source collection of Claude Code skills for research workflows.',
    tags: ['skills', 'tooling', 'open-source'],
    pinned: true,
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-04-21T14:00:00Z',
    memberLogins: ['yeji', 'dgu'],
    repos: [{ label: 'GitHub', url: 'https://github.com/example/claude-skill-suite' }],
    paperIds: [],
    releaseIds: ['r-002', 'r-003'],
  },
  {
    slug: 'alignment-probes',
    name: 'alignment-probes',
    description: 'Diagnostic probes for alignment failure modes in instruction-tuned models.',
    tags: ['safety', 'LLM', 'alignment'],
    pinned: true,
    createdAt: '2025-11-15T00:00:00Z',
    updatedAt: '2026-04-19T11:00:00Z',
    memberLogins: ['sooyoung', 'sungmin'],
    repos: [{ label: 'GitHub', url: 'https://github.com/example/alignment-probes' }],
    paperIds: ['p-003'],
    releaseIds: [],
  },
  {
    slug: 'long-context-eval',
    name: 'long-context-eval',
    description: 'Benchmarks for 1M-token context recall and coherence.',
    tags: ['eval', 'context', 'LLM'],
    pinned: true,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-04-17T19:00:00Z',
    memberLogins: ['haneul', 'minji'],
    repos: [
      { label: 'GitHub', url: 'https://github.com/example/long-context-eval' },
      { label: 'HuggingFace', url: 'https://huggingface.co/datasets/example/long-ctx' },
    ],
    paperIds: ['p-004'],
    releaseIds: ['r-004'],
  },
  {
    slug: 'KoLogicQA',
    name: 'KoLogicQA',
    description: 'Korean logical reasoning QA dataset, 12k items, human-verified.',
    tags: ['dataset', 'korean', 'reasoning'],
    pinned: true,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
    memberLogins: ['jiwoo', 'nari'],
    repos: [{ label: 'HuggingFace', url: 'https://huggingface.co/datasets/example/KoLogicQA' }],
    paperIds: ['p-005'],
    releaseIds: ['r-005', 'r-006'],
  },
  {
    slug: 'agentic-tool-use',
    name: 'agentic-tool-use',
    description: 'Evaluation framework for LLM agents using code-generation tools.',
    tags: ['agents', 'tool-use', 'LLM'],
    pinned: false,
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-04-20T16:00:00Z',
    memberLogins: ['yeji', 'taehyun', 'eunseo'],
    repos: [{ label: 'GitHub', url: 'https://github.com/example/agentic-tool-use' }],
    paperIds: ['p-006'],
    releaseIds: ['r-007'],
  },
];
```

- [ ] **Step 2: Typecheck and commit**

Run: `pnpm typecheck`
```bash
git add lib/mock/projects.ts
git commit -m "add mock project data (6 projects)"
```

---

## Task 7: Mock data — papers, experiments, discussions, releases, events, venues

**Files:**
- Create: `lib/mock/papers.ts`, `lib/mock/experiments.ts`, `lib/mock/discussions.ts`, `lib/mock/releases.ts`, `lib/mock/events.ts`, `lib/mock/venues.ts`

- [ ] **Step 1: Create papers fixture**

Create `lib/mock/papers.ts`:
```ts
import type { Paper } from '@/lib/types';

export const papers: Paper[] = [
  { id: 'p-001', title: 'Probing Reasoning Depth in Frontier LLMs', authorLogins: ['jihoon','sooyoung','junho'], projectSlug: 'reasoning-bench-v2', stage: 'writing', venue: 'NeurIPS 2026', deadline: '2026-05-04T23:59:00Z', draftUrl: 'https://example.com/drafts/p-001.pdf' },
  { id: 'p-002', title: 'A Benchmark for Multi-Hop Arithmetic Reasoning', authorLogins: ['junho','sooyoung'], projectSlug: 'reasoning-bench-v2', stage: 'review', venue: 'ICML 2026', draftUrl: 'https://example.com/drafts/p-002.pdf' },
  { id: 'p-003', title: 'Diagnostic Probes for Alignment Failures', authorLogins: ['sungmin','sooyoung'], projectSlug: 'alignment-probes', stage: 'experiments', venue: 'ICLR 2027' },
  { id: 'p-004', title: '1M-Token Coherence: A Long-Context Benchmark', authorLogins: ['haneul','minji'], projectSlug: 'long-context-eval', stage: 'published', venue: 'COLM 2026', pdfUrl: 'https://example.com/papers/p-004.pdf' },
  { id: 'p-005', title: 'KoLogicQA: Korean Logical Reasoning at Scale', authorLogins: ['jiwoo','nari'], projectSlug: 'KoLogicQA', stage: 'writing', venue: 'EMNLP 2026', deadline: '2026-06-15T23:59:00Z' },
  { id: 'p-006', title: 'Agentic Tool Use: An Evaluation Framework', authorLogins: ['yeji','taehyun','eunseo'], projectSlug: 'agentic-tool-use', stage: 'idea' },
  { id: 'p-007', title: 'When Chains Break: Reasoning Error Taxonomy', authorLogins: ['jihoon'], projectSlug: 'reasoning-bench-v2', stage: 'idea' },
  { id: 'p-008', title: 'Refusal Patterns in Aligned Models', authorLogins: ['sungmin'], projectSlug: 'alignment-probes', stage: 'writing', venue: 'NeurIPS 2026', deadline: '2026-05-04T23:59:00Z' },
  { id: 'p-009', title: 'Ultra-Long Retrieval Without Fine-tuning', authorLogins: ['haneul'], projectSlug: 'long-context-eval', stage: 'review', venue: 'ACL 2026' },
  { id: 'p-010', title: 'Skills as Primitives for Research Agents', authorLogins: ['yeji','dgu'], projectSlug: 'claude-skill-suite', stage: 'writing', venue: 'NeurIPS 2026 Workshop' },
  { id: 'p-011', title: 'Cross-Lingual Reasoning Transfer', authorLogins: ['jiwoo','sooyoung'], projectSlug: 'KoLogicQA', stage: 'experiments' },
  { id: 'p-012', title: 'Tool Selection Policies for LLM Agents', authorLogins: ['taehyun','yeji'], projectSlug: 'agentic-tool-use', stage: 'experiments' },
  { id: 'p-013', title: 'Failure-Mode Taxonomy for Aligned LLMs', authorLogins: ['sungmin','sooyoung'], projectSlug: 'alignment-probes', stage: 'published', venue: 'TMLR 2026', pdfUrl: 'https://example.com/papers/p-013.pdf' },
  { id: 'p-014', title: 'Context-Scaling Laws for Recall', authorLogins: ['minji','haneul'], projectSlug: 'long-context-eval', stage: 'writing', venue: 'ICLR 2027' },
  { id: 'p-015', title: 'Evaluation Harness for Claude Skills', authorLogins: ['dgu'], projectSlug: 'claude-skill-suite', stage: 'idea' },
];
```

- [ ] **Step 2: Create experiments fixture**

Create `lib/mock/experiments.ts`:
```ts
import type { ExperimentRun } from '@/lib/types';

export const experiments: ExperimentRun[] = [
  { id: 'exp-1428', name: 'sweep-context-len #1428', projectSlug: 'long-context-eval', status: 'in_progress', startedAt: '2026-04-22T05:30:00Z', triggeredByLogin: 'minji', summary: 'Sweeping 128K → 1M tokens across 4 models', stepsMock: [{ name: 'prepare', status: 'success', logSnippet: 'loaded 4 models' }, { name: 'run 128k', status: 'success' }, { name: 'run 512k', status: 'in_progress' }] },
  { id: 'exp-1427', name: 'sweep-context-len #1427', projectSlug: 'long-context-eval', status: 'success', startedAt: '2026-04-21T18:00:00Z', durationSec: 7_200, triggeredByLogin: 'minji' },
  { id: 'exp-1426', name: 'reasoning-eval #42', projectSlug: 'reasoning-bench-v2', status: 'success', startedAt: '2026-04-21T10:00:00Z', durationSec: 3_600, triggeredByLogin: 'jihoon' },
  { id: 'exp-1425', name: 'reasoning-eval #41', projectSlug: 'reasoning-bench-v2', status: 'failure', startedAt: '2026-04-20T22:00:00Z', durationSec: 340, triggeredByLogin: 'junho', summary: 'OOM on 80GB — reduce batch size' },
  { id: 'exp-1424', name: 'probe-suite #12', projectSlug: 'alignment-probes', status: 'success', startedAt: '2026-04-20T14:00:00Z', durationSec: 5_200, triggeredByLogin: 'sungmin' },
  { id: 'exp-1423', name: 'agentic-tool-eval #8', projectSlug: 'agentic-tool-use', status: 'cancelled', startedAt: '2026-04-20T09:00:00Z', durationSec: 120, triggeredByLogin: 'taehyun' },
  { id: 'exp-1422', name: 'skill-harness #3', projectSlug: 'claude-skill-suite', status: 'success', startedAt: '2026-04-19T16:00:00Z', durationSec: 900, triggeredByLogin: 'dgu' },
  { id: 'exp-1421', name: 'KoLogicQA-validate #7', projectSlug: 'KoLogicQA', status: 'success', startedAt: '2026-04-19T11:00:00Z', durationSec: 1_800, triggeredByLogin: 'nari' },
  { id: 'exp-1420', name: 'reasoning-eval #40', projectSlug: 'reasoning-bench-v2', status: 'queued', startedAt: '2026-04-22T06:00:00Z', triggeredByLogin: 'jihoon' },
  { id: 'exp-1419', name: 'probe-suite #11', projectSlug: 'alignment-probes', status: 'success', startedAt: '2026-04-18T13:00:00Z', durationSec: 4_800, triggeredByLogin: 'sungmin' },
  { id: 'exp-1418', name: 'long-ctx-recall #22', projectSlug: 'long-context-eval', status: 'success', startedAt: '2026-04-18T08:00:00Z', durationSec: 3_200, triggeredByLogin: 'haneul' },
  { id: 'exp-1417', name: 'agentic-tool-eval #7', projectSlug: 'agentic-tool-use', status: 'failure', startedAt: '2026-04-17T20:00:00Z', durationSec: 600, triggeredByLogin: 'eunseo', summary: 'Tool sandbox timeout' },
  { id: 'exp-1416', name: 'reasoning-eval #39', projectSlug: 'reasoning-bench-v2', status: 'success', startedAt: '2026-04-17T15:00:00Z', durationSec: 4_100, triggeredByLogin: 'junho' },
  { id: 'exp-1415', name: 'skill-harness #2', projectSlug: 'claude-skill-suite', status: 'success', startedAt: '2026-04-17T10:00:00Z', durationSec: 700, triggeredByLogin: 'dgu' },
  { id: 'exp-1414', name: 'KoLogicQA-validate #6', projectSlug: 'KoLogicQA', status: 'failure', startedAt: '2026-04-16T22:00:00Z', durationSec: 200, triggeredByLogin: 'jiwoo', summary: 'Schema mismatch in v1.2 export' },
  { id: 'exp-1413', name: 'probe-suite #10', projectSlug: 'alignment-probes', status: 'success', startedAt: '2026-04-16T14:00:00Z', durationSec: 3_900, triggeredByLogin: 'sungmin' },
  { id: 'exp-1412', name: 'long-ctx-recall #21', projectSlug: 'long-context-eval', status: 'success', startedAt: '2026-04-16T09:00:00Z', durationSec: 2_800, triggeredByLogin: 'minji' },
  { id: 'exp-1411', name: 'agentic-tool-eval #6', projectSlug: 'agentic-tool-use', status: 'success', startedAt: '2026-04-15T19:00:00Z', durationSec: 1_500, triggeredByLogin: 'yeji' },
  { id: 'exp-1410', name: 'reasoning-eval #38', projectSlug: 'reasoning-bench-v2', status: 'success', startedAt: '2026-04-15T12:00:00Z', durationSec: 3_800, triggeredByLogin: 'jihoon' },
  { id: 'exp-1409', name: 'skill-harness #1', projectSlug: 'claude-skill-suite', status: 'failure', startedAt: '2026-04-14T17:00:00Z', durationSec: 100, triggeredByLogin: 'dgu', summary: 'Missing env var CLAUDE_API_KEY' },
  { id: 'exp-1408', name: 'KoLogicQA-validate #5', projectSlug: 'KoLogicQA', status: 'success', startedAt: '2026-04-14T10:00:00Z', durationSec: 1_600, triggeredByLogin: 'nari' },
  { id: 'exp-1407', name: 'probe-suite #9', projectSlug: 'alignment-probes', status: 'success', startedAt: '2026-04-13T18:00:00Z', durationSec: 3_500, triggeredByLogin: 'sungmin' },
  { id: 'exp-1406', name: 'long-ctx-recall #20', projectSlug: 'long-context-eval', status: 'cancelled', startedAt: '2026-04-13T12:00:00Z', durationSec: 60, triggeredByLogin: 'haneul' },
  { id: 'exp-1405', name: 'agentic-tool-eval #5', projectSlug: 'agentic-tool-use', status: 'success', startedAt: '2026-04-12T21:00:00Z', durationSec: 2_100, triggeredByLogin: 'taehyun' },
  { id: 'exp-1404', name: 'reasoning-eval #37', projectSlug: 'reasoning-bench-v2', status: 'success', startedAt: '2026-04-12T14:00:00Z', durationSec: 4_500, triggeredByLogin: 'junho' },
];
```

- [ ] **Step 3: Create discussions fixture**

Create `lib/mock/discussions.ts`:
```ts
import type { Discussion } from '@/lib/types';

export const discussions: Discussion[] = [
  { id: 'd-001', category: 'announcements', title: 'Group meeting moved to Friday 10AM', authorLogin: 'sooyoung', createdAt: '2026-04-20T09:00:00Z', lastActivityAt: '2026-04-20T15:00:00Z', replyCount: 4, bodyMarkdown: '### Heads up\nGroup meeting is **Friday 10AM KST** this week. Dongyu presents on the skill suite.', replies: [{ authorLogin: 'dgu', createdAt: '2026-04-20T10:00:00Z', bodyMarkdown: 'Slides ready by Thu night.' }, { authorLogin: 'yeji', createdAt: '2026-04-20T12:00:00Z', bodyMarkdown: 'Can we include the eval harness demo?' }] },
  { id: 'd-002', category: 'journal_club', title: 'Paper: "Context-Scaling Laws for Recall"', authorLogin: 'haneul', createdAt: '2026-04-18T14:00:00Z', lastActivityAt: '2026-04-21T18:00:00Z', replyCount: 7, bodyMarkdown: 'Discussing arXiv 2604.01234. Focus on §4 (scaling exponent).', replies: [{ authorLogin: 'minji', createdAt: '2026-04-18T15:00:00Z', bodyMarkdown: 'Exponent seems sensitive to tokenizer choice.' }] },
  { id: 'd-003', category: 'qa', title: 'How do we handle OOM in reasoning-eval?', authorLogin: 'junho', createdAt: '2026-04-21T22:30:00Z', lastActivityAt: '2026-04-22T01:00:00Z', replyCount: 3, bodyMarkdown: 'Run #41 OOM-ed on 80GB. Options: reduce batch, shard, or upgrade GPU?', replies: [{ authorLogin: 'jihoon', createdAt: '2026-04-21T23:00:00Z', bodyMarkdown: 'Try gradient checkpointing first.' }] },
  { id: 'd-004', category: 'ideas', title: 'Should we rerun Table 3 with Claude 4.7?', authorLogin: 'sungmin', createdAt: '2026-04-21T11:00:00Z', lastActivityAt: '2026-04-21T17:00:00Z', replyCount: 5, bodyMarkdown: 'NeurIPS deadline is tight but the newer model may shift conclusions.', replies: [] },
  { id: 'd-005', category: 'announcements', title: 'Cluster maintenance next Saturday', authorLogin: 'sooyoung', createdAt: '2026-04-19T08:00:00Z', lastActivityAt: '2026-04-19T08:30:00Z', replyCount: 0, bodyMarkdown: 'GPU cluster down 9AM–5PM Saturday. Plan accordingly.', replies: [] },
  { id: 'd-006', category: 'journal_club', title: 'Paper: "Refusal Steering in RLHF Models"', authorLogin: 'sungmin', createdAt: '2026-04-15T13:00:00Z', lastActivityAt: '2026-04-17T19:00:00Z', replyCount: 6, bodyMarkdown: 'Led by Sungmin. Discussion at Wed 3PM.', replies: [] },
  { id: 'd-007', category: 'qa', title: 'Best HF dataset format for KoLogicQA?', authorLogin: 'nari', createdAt: '2026-04-14T16:00:00Z', lastActivityAt: '2026-04-15T10:00:00Z', replyCount: 4, bodyMarkdown: 'Parquet vs JSONL — tradeoffs for our access patterns?', replies: [] },
  { id: 'd-008', category: 'ideas', title: 'A skill for auto-generating lit-review drafts?', authorLogin: 'dgu', createdAt: '2026-04-12T20:00:00Z', lastActivityAt: '2026-04-14T14:00:00Z', replyCount: 8, bodyMarkdown: 'Would save hours per paper. Scope?', replies: [] },
  { id: 'd-009', category: 'qa', title: 'How do you log agentic-tool-use traces?', authorLogin: 'eunseo', createdAt: '2026-04-11T15:00:00Z', lastActivityAt: '2026-04-13T09:00:00Z', replyCount: 3, bodyMarkdown: 'New to the project, looking for the logging convention.', replies: [] },
  { id: 'd-010', category: 'announcements', title: 'Welcome Eunseo, summer intern!', authorLogin: 'sooyoung', createdAt: '2026-04-10T09:00:00Z', lastActivityAt: '2026-04-10T17:00:00Z', replyCount: 9, bodyMarkdown: 'Eunseo joins agentic-tool-use through August.', replies: [] },
];
```

- [ ] **Step 4: Create releases fixture**

Create `lib/mock/releases.ts`:
```ts
import type { Release } from '@/lib/types';

export const releases: Release[] = [
  { id: 'r-001', name: 'reasoning-bench', kind: 'dataset', projectSlug: 'reasoning-bench-v2', version: 'v2.0', publishedAt: '2026-03-15T00:00:00Z', description: '8,400 multi-step reasoning items with human-verified rationales.' },
  { id: 'r-002', name: 'claude-skill-suite', kind: 'tool', projectSlug: 'claude-skill-suite', version: 'v0.4.0', publishedAt: '2026-04-10T00:00:00Z', description: 'Suite of Claude Code skills for research workflows.' },
  { id: 'r-003', name: 'paper-search', kind: 'skill', projectSlug: 'claude-skill-suite', version: 'v0.2.1', publishedAt: '2026-04-15T00:00:00Z', description: 'Claude Code skill for cross-venue paper search.' },
  { id: 'r-004', name: 'long-context-eval', kind: 'dataset', projectSlug: 'long-context-eval', version: 'v1.0', publishedAt: '2026-04-01T00:00:00Z', description: '1M-token recall benchmark with 600 needles.' },
  { id: 'r-005', name: 'KoLogicQA', kind: 'dataset', projectSlug: 'KoLogicQA', version: 'v1.2', publishedAt: '2026-04-21T00:00:00Z', description: '12k Korean logical reasoning items.' },
  { id: 'r-006', name: 'KoLogicQA-eval', kind: 'tool', projectSlug: 'KoLogicQA', version: 'v0.3.0', publishedAt: '2026-04-05T00:00:00Z', description: 'Evaluation harness for KoLogicQA.' },
  { id: 'r-007', name: 'agentic-tool-eval', kind: 'tool', projectSlug: 'agentic-tool-use', version: 'v0.1.0', publishedAt: '2026-04-18T00:00:00Z', description: 'Framework for evaluating agentic tool selection.' },
  { id: 'r-008', name: 'reasoning-probe-kit', kind: 'skill', projectSlug: 'claude-skill-suite', version: 'v0.1.0', publishedAt: '2026-04-19T00:00:00Z', description: 'Claude Code skill for interactive model reasoning probes.' },
];
```

- [ ] **Step 5: Create events fixture**

Create `lib/mock/events.ts`:
```ts
import type { ActivityEvent } from '@/lib/types';

export const events: ActivityEvent[] = [
  { id: 'e-001', type: 'paper', actorLogin: 'jihoon', projectSlug: 'reasoning-bench-v2', createdAt: '2026-04-22T05:30:00Z', payload: { paperId: 'p-001', action: 'uploaded_draft', version: 3 } },
  { id: 'e-002', type: 'experiment', actorLogin: 'minji', projectSlug: 'long-context-eval', createdAt: '2026-04-22T05:30:00Z', payload: { runId: 'exp-1428', action: 'started' } },
  { id: 'e-003', type: 'release', actorLogin: 'jiwoo', projectSlug: 'KoLogicQA', createdAt: '2026-04-21T10:00:00Z', payload: { releaseId: 'r-005', action: 'published' } },
  { id: 'e-004', type: 'discussion', actorLogin: 'sungmin', createdAt: '2026-04-21T11:00:00Z', payload: { discussionId: 'd-004', action: 'opened' } },
  { id: 'e-005', type: 'experiment', actorLogin: 'junho', projectSlug: 'reasoning-bench-v2', createdAt: '2026-04-20T22:00:00Z', payload: { runId: 'exp-1425', action: 'failed' } },
  { id: 'e-006', type: 'paper', actorLogin: 'sungmin', projectSlug: 'alignment-probes', createdAt: '2026-04-20T18:00:00Z', payload: { paperId: 'p-008', action: 'created' } },
  { id: 'e-007', type: 'release', actorLogin: 'dgu', projectSlug: 'claude-skill-suite', createdAt: '2026-04-19T20:00:00Z', payload: { releaseId: 'r-008', action: 'published' } },
  { id: 'e-008', type: 'project', actorLogin: 'yeji', projectSlug: 'agentic-tool-use', createdAt: '2026-04-18T14:00:00Z', payload: { action: 'updated_readme' } },
  { id: 'e-009', type: 'discussion', actorLogin: 'haneul', createdAt: '2026-04-18T14:00:00Z', payload: { discussionId: 'd-002', action: 'opened' } },
  { id: 'e-010', type: 'experiment', actorLogin: 'minji', projectSlug: 'long-context-eval', createdAt: '2026-04-21T18:00:00Z', payload: { runId: 'exp-1427', action: 'succeeded' } },
  { id: 'e-011', type: 'paper', actorLogin: 'haneul', projectSlug: 'long-context-eval', createdAt: '2026-04-17T10:00:00Z', payload: { paperId: 'p-004', action: 'published' } },
  { id: 'e-012', type: 'release', actorLogin: 'dgu', projectSlug: 'claude-skill-suite', createdAt: '2026-04-15T10:00:00Z', payload: { releaseId: 'r-003', action: 'published' } },
];
```

- [ ] **Step 6: Create venues fixture**

Create `lib/mock/venues.ts`:
```ts
import type { Venue } from '@/lib/types';

export const venues: Venue[] = [
  { id: 'v-neurips-26-abs', name: 'NeurIPS 2026', deadline: '2026-05-04T23:59:00Z', kind: 'abstract' },
  { id: 'v-neurips-26-full', name: 'NeurIPS 2026', deadline: '2026-05-11T23:59:00Z', kind: 'full' },
  { id: 'v-icml-26-cr', name: 'ICML 2026', deadline: '2026-05-13T23:59:00Z', kind: 'camera_ready' },
  { id: 'v-acl-26-rb', name: 'ACL 2026', deadline: '2026-05-20T23:59:00Z', kind: 'rebuttal' },
  { id: 'v-emnlp-26', name: 'EMNLP 2026', deadline: '2026-06-15T23:59:00Z', kind: 'full' },
  { id: 'v-colm-26', name: 'COLM 2026', deadline: '2026-07-01T23:59:00Z', kind: 'full' },
  { id: 'v-iclr-27', name: 'ICLR 2027', deadline: '2026-09-28T23:59:00Z', kind: 'full' },
];
```

- [ ] **Step 7: Typecheck and commit**

Run: `pnpm typecheck`
```bash
git add lib/mock
git commit -m "add mock fixtures (papers, experiments, discussions, releases, events, venues)"
```

---

## Task 8: Mock index with helper queries + integrity test

**Files:**
- Create: `lib/mock/index.ts`, `tests/data-integrity.spec.ts`

- [ ] **Step 1: Write failing integrity test**

Create `tests/data-integrity.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import {
  members, projects, papers, experiments, discussions, releases, events, venues,
  getProjectBySlug, getMemberByLogin, getPapersByProject, getRunsByProject,
  getReleasesByProject, getPinnedProjects,
} from '@/lib/mock';

test.describe('mock data integrity', () => {
  test('all IDs are unique within their collection', () => {
    const check = (name: string, ids: string[]) => {
      expect(new Set(ids).size, name).toBe(ids.length);
    };
    check('members', members.map(m => m.login));
    check('projects', projects.map(p => p.slug));
    check('papers', papers.map(p => p.id));
    check('experiments', experiments.map(e => e.id));
    check('discussions', discussions.map(d => d.id));
    check('releases', releases.map(r => r.id));
    check('events', events.map(e => e.id));
    check('venues', venues.map(v => v.id));
  });

  test('every projectSlug reference points to an existing project', () => {
    const slugs = new Set(projects.map(p => p.slug));
    for (const p of papers) expect(slugs.has(p.projectSlug), `paper ${p.id}`).toBe(true);
    for (const e of experiments) expect(slugs.has(e.projectSlug), `exp ${e.id}`).toBe(true);
    for (const r of releases) expect(slugs.has(r.projectSlug), `release ${r.id}`).toBe(true);
    for (const ev of events) if (ev.projectSlug) expect(slugs.has(ev.projectSlug), `event ${ev.id}`).toBe(true);
  });

  test('every login reference points to an existing member', () => {
    const logins = new Set(members.map(m => m.login));
    for (const p of projects) for (const l of p.memberLogins) expect(logins.has(l), `project ${p.slug}`).toBe(true);
    for (const p of papers) for (const l of p.authorLogins) expect(logins.has(l), `paper ${p.id}`).toBe(true);
    for (const e of experiments) expect(logins.has(e.triggeredByLogin), `exp ${e.id}`).toBe(true);
    for (const d of discussions) expect(logins.has(d.authorLogin), `discussion ${d.id}`).toBe(true);
    for (const ev of events) expect(logins.has(ev.actorLogin), `event ${ev.id}`).toBe(true);
  });

  test('helper queries return expected shapes', () => {
    expect(getProjectBySlug('reasoning-bench-v2')).toBeDefined();
    expect(getProjectBySlug('nonexistent')).toBeUndefined();
    expect(getMemberByLogin('dgu')?.role).toBe('PhD');
    expect(getPapersByProject('reasoning-bench-v2').length).toBeGreaterThan(0);
    expect(getRunsByProject('long-context-eval').length).toBeGreaterThan(0);
    expect(getReleasesByProject('claude-skill-suite').length).toBeGreaterThan(0);
    expect(getPinnedProjects().every(p => p.pinned)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails (module doesn't exist)**

Run: `pnpm test tests/data-integrity.spec.ts`
Expected: FAIL — cannot find `@/lib/mock`.

- [ ] **Step 3: Create mock index with helpers**

Create `lib/mock/index.ts`:
```ts
import { members } from './members';
import { projects } from './projects';
import { papers } from './papers';
import { experiments } from './experiments';
import { discussions } from './discussions';
import { releases } from './releases';
import { events } from './events';
import { venues } from './venues';
import type { Slug, UserLogin } from '@/lib/types';

export { members, projects, papers, experiments, discussions, releases, events, venues };

export const CURRENT_USER: UserLogin = 'dgu';

export function getProjectBySlug(slug: Slug) {
  return projects.find(p => p.slug === slug);
}
export function getMemberByLogin(login: UserLogin) {
  return members.find(m => m.login === login);
}
export function getPinnedProjects() {
  return projects.filter(p => p.pinned);
}
export function getPapersByProject(slug: Slug) {
  return papers.filter(p => p.projectSlug === slug);
}
export function getRunsByProject(slug: Slug) {
  return experiments.filter(e => e.projectSlug === slug);
}
export function getReleasesByProject(slug: Slug) {
  return releases.filter(r => r.projectSlug === slug);
}
export function getMembersByProject(slug: Slug) {
  const proj = getProjectBySlug(slug);
  if (!proj) return [];
  return members.filter(m => proj.memberLogins.includes(m.login));
}
export function getUpcomingVenues(now = new Date()) {
  return venues
    .filter(v => new Date(v.deadline) >= now)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}
export function getRecentEvents(limit = 20) {
  return [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}
export function getDiscussionById(id: string) {
  return discussions.find(d => d.id === id);
}
export function getRunById(id: string) {
  return experiments.find(e => e.id === id);
}
export function getReleaseById(id: string) {
  return releases.find(r => r.id === id);
}
export function getPaperById(id: string) {
  return papers.find(p => p.id === id);
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `pnpm test tests/data-integrity.spec.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "add mock index with helper queries and integrity tests"
```

---

## Task 9: Shared UI primitives — Avatar, StatusBadge, LabelChip, EmptyState

**Files:**
- Create: `components/people/Avatar.tsx`, `components/people/AvatarStack.tsx`, `components/badges/StatusBadge.tsx`, `components/badges/LabelChip.tsx`, `components/misc/EmptyState.tsx`

- [ ] **Step 1: Create Avatar**

Create `components/people/Avatar.tsx`:
```tsx
import { cn } from '@/lib/cn';

interface Props {
  login: string;
  size?: number;
  className?: string;
}

function hashColor(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 55%, 60%)`;
}

export function Avatar({ login, size = 20, className }: Props) {
  const initials = login.slice(0, 2).toUpperCase();
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full text-[10px] font-semibold text-white select-none', className)}
      style={{ width: size, height: size, background: hashColor(login) }}
      aria-label={login}
      title={login}
    >
      {initials}
    </span>
  );
}
```

- [ ] **Step 2: Create AvatarStack**

Create `components/people/AvatarStack.tsx`:
```tsx
import { Avatar } from './Avatar';
import { cn } from '@/lib/cn';

export function AvatarStack({ logins, size = 20, max = 4, className }: { logins: string[]; size?: number; max?: number; className?: string }) {
  const visible = logins.slice(0, max);
  const overflow = logins.length - visible.length;
  return (
    <span className={cn('inline-flex items-center', className)}>
      {visible.map((l, i) => (
        <span key={l} className="rounded-full ring-1 ring-white" style={{ marginLeft: i === 0 ? 0 : -6 }}>
          <Avatar login={l} size={size} />
        </span>
      ))}
      {overflow > 0 && (
        <span className="ml-1 text-xs text-fg-muted">+{overflow}</span>
      )}
    </span>
  );
}
```

- [ ] **Step 3: Create StatusBadge**

Create `components/badges/StatusBadge.tsx`:
```tsx
import { CheckCircleFillIcon, XCircleFillIcon, DotFillIcon, StopIcon, ClockIcon } from '@primer/octicons-react';
import type { RunStatus } from '@/lib/types';
import { cn } from '@/lib/cn';

const config: Record<RunStatus, { icon: React.ComponentType<{ size?: number }>; label: string; cls: string }> = {
  success:     { icon: CheckCircleFillIcon, label: 'Success',     cls: 'text-success-fg' },
  failure:     { icon: XCircleFillIcon,     label: 'Failure',     cls: 'text-danger-fg' },
  in_progress: { icon: DotFillIcon,         label: 'In progress', cls: 'text-attention-fg animate-pulse' },
  queued:      { icon: ClockIcon,           label: 'Queued',      cls: 'text-fg-muted' },
  cancelled:   { icon: StopIcon,            label: 'Cancelled',   cls: 'text-fg-muted' },
};

export function StatusBadge({ status, showLabel = false, className }: { status: RunStatus; showLabel?: boolean; className?: string }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={cn('inline-flex items-center gap-1', c.cls, className)} title={c.label}>
      <Icon size={14} />
      {showLabel && <span className="text-xs">{c.label}</span>}
    </span>
  );
}
```

- [ ] **Step 4: Create LabelChip**

Create `components/badges/LabelChip.tsx`:
```tsx
import { cn } from '@/lib/cn';

export function LabelChip({ children, tone = 'neutral', className }: { children: React.ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'attention' | 'danger' | 'done'; className?: string }) {
  const tones: Record<string, string> = {
    neutral:   'bg-canvas-inset text-fg-muted border-border-default',
    accent:    'bg-accent-subtle text-accent-fg border-accent-subtle',
    success:   'bg-success-subtle text-success-fg border-success-subtle',
    attention: 'bg-attention-subtle text-attention-fg border-attention-subtle',
    danger:    'bg-danger-subtle text-danger-fg border-danger-subtle',
    done:      'bg-done-subtle text-done-fg border-done-subtle',
  };
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-xs border', tones[tone], className)}>
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Create EmptyState**

Create `components/misc/EmptyState.tsx`:
```tsx
export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="border border-dashed border-border-default rounded-md p-8 text-center">
      <p className="font-semibold text-fg-default">{title}</p>
      {body && <p className="text-fg-muted text-sm mt-1">{body}</p>}
    </div>
  );
}
```

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm typecheck`
```bash
git add components
git commit -m "add shared UI primitives (Avatar, Badge, LabelChip, EmptyState)"
```

---

## Task 10: MarkdownBody component

**Files:**
- Create: `components/md/MarkdownBody.tsx`

- [ ] **Step 1: Implement MarkdownBody**

Create `components/md/MarkdownBody.tsx`:
```tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';

export function MarkdownBody({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn('prose prose-sm max-w-none text-fg-default [&_a]:text-accent-fg [&_code]:bg-canvas-inset [&_code]:px-1 [&_code]:rounded [&_pre]:bg-canvas-inset [&_pre]:p-3 [&_pre]:rounded-md', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm typecheck`
```bash
git add components/md
git commit -m "add MarkdownBody component"
```

---

## Task 11: TopNav + root layout

**Files:**
- Create: `components/nav/TopNav.tsx`, `components/ui/dropdown-menu.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Generate shadcn dropdown-menu primitive**

Create `components/ui/dropdown-menu.tsx`:
```tsx
'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/cn';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={4}
        className={cn('z-50 min-w-[180px] bg-white border border-border-default rounded-md shadow-md p-1', className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn('px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-canvas-subtle focus:bg-canvas-subtle outline-none', className)}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Write TopNav**

Create `components/nav/TopNav.tsx`:
```tsx
import Link from 'next/link';
import { MarkGithubIcon, SearchIcon, PlusIcon, ChevronDownIcon } from '@primer/octicons-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/people/Avatar';
import { CURRENT_USER } from '@/lib/mock';

export function TopNav() {
  return (
    <header role="banner" className="bg-[#24292f] text-white border-b border-black/20">
      <div className="max-w-screen-2xl mx-auto flex items-center gap-4 px-4 h-12">
        <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-80">
          <MarkGithubIcon size={22} />
          <span>LabHub</span>
        </Link>
        <div className="relative flex-none w-[280px]">
          <SearchIcon size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            type="search"
            placeholder="Search projects, papers, people…"
            className="w-full h-7 pl-7 pr-2 rounded-md bg-white/10 text-[12px] text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-accent-emphasis"
          />
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/experiments" className="hover:opacity-80">Experiments</Link>
          <Link href="/pipeline"    className="hover:opacity-80">Pipeline</Link>
          <Link href="/discussions" className="hover:opacity-80">Discussions</Link>
        </nav>
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 hover:opacity-80" aria-label="Create new">
            <PlusIcon size={16} /><ChevronDownIcon size={12} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-fg-default">
            <DropdownMenuItem onSelect={() => { /* placeholder */ }}>New project</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { /* placeholder */ }}>New paper</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { /* placeholder */ }}>New experiment</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { /* placeholder */ }}>New discussion</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Account menu" className="rounded-full">
            <Avatar login={CURRENT_USER} size={24} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-fg-default">
            <DropdownMenuItem asChild>
              <Link href={`/members/${CURRENT_USER}`}>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { /* placeholder */ }}>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Update root layout**

Replace `app/layout.tsx` with:
```tsx
import type { Metadata } from 'next';
import { TopNav } from '@/components/nav/TopNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'LabHub',
  description: 'Research lab dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas-subtle">
        <TopNav />
        <main className="max-w-screen-2xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Run smoke test — expect home test passes**

Run: `pnpm test tests/smoke/home.spec.ts`
Expected: PASS (banner is now present).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "add TopNav and root layout"
```

---

## Task 12: ProjectCard component and pinned-projects helper

**Files:**
- Create: `components/project/ProjectCard.tsx`

- [ ] **Step 1: Implement ProjectCard**

Create `components/project/ProjectCard.tsx`:
```tsx
import Link from 'next/link';
import { RepoIcon } from '@primer/octicons-react';
import type { Project } from '@/lib/types';
import { LabelChip } from '@/components/badges/LabelChip';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block border border-border-default rounded-md bg-white p-4 hover:border-accent-fg transition-colors"
    >
      <div className="flex items-center gap-2 text-accent-fg font-semibold text-sm">
        <RepoIcon size={16} />
        {project.name}
      </div>
      <p className="mt-2 text-fg-muted text-xs leading-5 line-clamp-2 min-h-[40px]">{project.description}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {project.tags.map(t => <LabelChip key={t}>{t}</LabelChip>)}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
pnpm typecheck
git add components/project
git commit -m "add ProjectCard component"
```

---

## Task 13: ActivityFeedItem + DeadlineList

**Files:**
- Create: `components/feed/ActivityFeedItem.tsx`, `components/misc/DeadlineList.tsx`

- [ ] **Step 1: Implement ActivityFeedItem**

Create `components/feed/ActivityFeedItem.tsx`:
```tsx
import Link from 'next/link';
import type { ActivityEvent } from '@/lib/types';
import { Avatar } from '@/components/people/Avatar';
import { LabelChip } from '@/components/badges/LabelChip';
import { getMemberByLogin, getProjectBySlug, getPaperById, getReleaseById, getRunById, getDiscussionById } from '@/lib/mock';

function relTime(iso: string, now = Date.now()) {
  const diffMin = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const toneByType = { paper: 'accent', experiment: 'attention', release: 'success', discussion: 'done', project: 'neutral' } as const;

function renderBody(e: ActivityEvent) {
  const actor = getMemberByLogin(e.actorLogin)?.displayName ?? e.actorLogin;
  const proj = e.projectSlug ? getProjectBySlug(e.projectSlug)?.name : undefined;
  const projLink = e.projectSlug ? (
    <Link href={`/projects/${e.projectSlug}`} className="text-accent-fg hover:underline">{proj}</Link>
  ) : null;

  switch (e.type) {
    case 'paper': {
      const paper = getPaperById(e.payload.paperId as string);
      const action = e.payload.action === 'uploaded_draft'
        ? `uploaded draft v${e.payload.version} of`
        : e.payload.action === 'published' ? 'published' : 'created';
      return <span><b>{actor}</b> {action} <i>"{paper?.title ?? 'a paper'}"</i> in {projLink}</span>;
    }
    case 'experiment': {
      const run = getRunById(e.payload.runId as string);
      const verb = e.payload.action === 'started' ? 'started' : e.payload.action === 'failed' ? 'failed' : 'finished';
      return <span><b>{actor}</b> {verb} run <code className="bg-canvas-inset px-1 rounded">{run?.name ?? e.payload.runId as string}</code> in {projLink}</span>;
    }
    case 'release': {
      const rel = getReleaseById(e.payload.releaseId as string);
      return <span><b>{actor}</b> released <i>{rel?.name} {rel?.version}</i> in {projLink}</span>;
    }
    case 'discussion': {
      const d = getDiscussionById(e.payload.discussionId as string);
      return <span><b>{actor}</b> opened <Link href={`/discussions/${d?.id}`} className="text-accent-fg hover:underline">{d?.title ?? 'a discussion'}</Link></span>;
    }
    case 'project':
      return <span><b>{actor}</b> updated {projLink}</span>;
  }
}

export function ActivityFeedItem({ event }: { event: ActivityEvent }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-muted last:border-0">
      <Avatar login={event.actorLogin} size={24} />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm">
          <LabelChip tone={toneByType[event.type]}>{event.type}</LabelChip>
          <span>{renderBody(event)}</span>
        </div>
        <div className="text-xs text-fg-muted mt-1">{relTime(event.createdAt)}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement DeadlineList**

Create `components/misc/DeadlineList.tsx`:
```tsx
import type { Venue } from '@/lib/types';

function daysUntil(iso: string, now = Date.now()) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 86_400_000));
}

export function DeadlineList({ venues, title = 'Upcoming' }: { venues: Venue[]; title?: string }) {
  return (
    <section className="bg-white border border-border-default rounded-md p-4">
      <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">{title}</h3>
      <ul className="space-y-2">
        {venues.map(v => (
          <li key={v.id} className="text-sm flex items-baseline justify-between gap-3">
            <span>
              <span className="font-medium">{v.name}</span>
              <span className="text-fg-muted"> · {v.kind.replace('_', ' ')}</span>
            </span>
            <span className="text-xs text-fg-muted whitespace-nowrap">in {daysUntil(v.deadline)}d</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add -A
git commit -m "add ActivityFeedItem and DeadlineList components"
```

---

## Task 14: Dashboard page (A)

**Files:**
- Modify: `app/page.tsx`
- Create: `tests/smoke/dashboard.spec.ts`

- [ ] **Step 1: Write failing smoke test**

Create `tests/smoke/dashboard.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('dashboard shows pinned projects and activity feed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Pinned projects')).toBeVisible();
  await expect(page.getByText('Upcoming')).toBeVisible();
  await expect(page.getByText('Recent activity')).toBeVisible();
  await expect(page.getByRole('link', { name: /reasoning-bench-v2/ })).toBeVisible();
});
```

- [ ] **Step 2: Run test — expect fail**

Run: `pnpm test tests/smoke/dashboard.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement dashboard**

Replace `app/page.tsx` with:
```tsx
import { PlusIcon } from '@primer/octicons-react';
import Link from 'next/link';
import { ProjectCard } from '@/components/project/ProjectCard';
import { ActivityFeedItem } from '@/components/feed/ActivityFeedItem';
import { DeadlineList } from '@/components/misc/DeadlineList';
import { getPinnedProjects, getUpcomingVenues, getRecentEvents } from '@/lib/mock';

export default function Dashboard() {
  const pinned = getPinnedProjects();
  const venues = getUpcomingVenues().slice(0, 5);
  const events = getRecentEvents(12);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <h2 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-3">Pinned projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pinned.map(p => <ProjectCard key={p.slug} project={p} />)}
            <Link
              href="/projects"
              className="border border-dashed border-border-default rounded-md p-4 flex flex-col items-center justify-center text-fg-muted hover:border-accent-fg hover:text-accent-fg"
            >
              <PlusIcon size={20} />
              <span className="text-sm mt-1">New project</span>
            </Link>
          </div>
        </div>
        <DeadlineList venues={venues} />
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-3">Recent activity</h2>
        <div className="bg-white border border-border-default rounded-md px-4">
          {events.map(e => <ActivityFeedItem key={e.id} event={e} />)}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `pnpm test tests/smoke/dashboard.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "add dashboard home page with pinned projects, feed, and deadlines"
```

---

## Task 15: Projects index page

**Files:**
- Create: `app/projects/page.tsx`, `tests/smoke/projects.spec.ts`

- [ ] **Step 1: Write failing smoke test**

Create `tests/smoke/projects.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('/projects lists all projects', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /agentic-tool-use/ })).toBeVisible();
});
```

- [ ] **Step 2: Run test — expect 404**

Run: `pnpm test tests/smoke/projects.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Create page**

Create `app/projects/page.tsx`:
```tsx
import { ProjectCard } from '@/components/project/ProjectCard';
import { projects } from '@/lib/mock';

export default function ProjectsIndex() {
  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {projects.map(p => <ProjectCard key={p.slug} project={p} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Test passes + commit**

```bash
pnpm test tests/smoke/projects.spec.ts
git add -A
git commit -m "add projects index page"
```

---

## Task 16: Project detail shell — header + tab bar + Overview tab

**Files:**
- Create: `components/project/ProjectHeader.tsx`, `components/project/TabBar.tsx`
- Create: `app/projects/[slug]/layout.tsx`, `app/projects/[slug]/page.tsx`
- Create: `tests/smoke/project-detail.spec.ts`

- [ ] **Step 1: Write failing test**

Create `tests/smoke/project-detail.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('project detail renders header and tabs', async ({ page }) => {
  await page.goto('/projects/reasoning-bench-v2');
  await expect(page.getByRole('heading', { name: 'reasoning-bench-v2' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Experiments' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Papers' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Data' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Members' })).toBeVisible();
});

test('unknown project returns 404', async ({ page }) => {
  const res = await page.goto('/projects/does-not-exist');
  expect(res?.status()).toBe(404);
});
```

- [ ] **Step 2: Implement ProjectHeader**

Create `components/project/ProjectHeader.tsx`:
```tsx
import { RepoIcon, StarIcon, EyeIcon, RepoForkedIcon } from '@primer/octicons-react';
import type { Project } from '@/lib/types';
import { LabelChip } from '@/components/badges/LabelChip';

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="pb-4 border-b border-border-muted">
      <div className="flex items-center gap-2">
        <RepoIcon size={18} />
        <h1 className="text-lg font-semibold">{project.name}</h1>
        <span className="ml-auto flex gap-2 text-xs">
          <button className="inline-flex items-center gap-1 px-2 h-7 border border-border-default rounded-md bg-canvas-subtle hover:bg-canvas-inset"><EyeIcon size={14}/> Watch</button>
          <button className="inline-flex items-center gap-1 px-2 h-7 border border-border-default rounded-md bg-canvas-subtle hover:bg-canvas-inset"><RepoForkedIcon size={14}/> Fork</button>
          <button className="inline-flex items-center gap-1 px-2 h-7 border border-border-default rounded-md bg-canvas-subtle hover:bg-canvas-inset"><StarIcon size={14}/> Star</button>
        </span>
      </div>
      {project.description && <p className="mt-2 text-sm text-fg-muted">{project.description}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        {project.tags.map(t => <LabelChip key={t} tone="accent">{t}</LabelChip>)}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement TabBar**

Create `components/project/TabBar.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookIcon, PlayIcon, FileIcon, DatabaseIcon, PeopleIcon } from '@primer/octicons-react';
import { cn } from '@/lib/cn';

const TABS = [
  { key: 'overview',    label: 'Overview',    Icon: BookIcon,     href: '' },
  { key: 'experiments', label: 'Experiments', Icon: PlayIcon,     href: '/experiments' },
  { key: 'papers',      label: 'Papers',      Icon: FileIcon,     href: '/papers' },
  { key: 'data',        label: 'Data',        Icon: DatabaseIcon, href: '/data' },
  { key: 'members',     label: 'Members',     Icon: PeopleIcon,   href: '/members' },
] as const;

export function TabBar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/projects/${slug}`;
  return (
    <nav className="border-b border-border-muted">
      <ul className="flex gap-1">
        {TABS.map(t => {
          const href = base + t.href;
          const active = t.key === 'overview' ? pathname === base : pathname.startsWith(href);
          return (
            <li key={t.key}>
              <Link
                href={href}
                className={cn(
                  'inline-flex items-center gap-2 px-3 h-10 text-sm border-b-2',
                  active ? 'border-[#fd8c73] font-semibold' : 'border-transparent text-fg-muted hover:text-fg-default'
                )}
              >
                <t.Icon size={14} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: Create layout**

Create `app/projects/[slug]/layout.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { TabBar } from '@/components/project/TabBar';
import { getProjectBySlug } from '@/lib/mock';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <div className="space-y-4">
      <ProjectHeader project={project} />
      <TabBar slug={slug} />
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Create Overview tab**

Create `app/projects/[slug]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LinkExternalIcon, TagIcon } from '@primer/octicons-react';
import { MarkdownBody } from '@/components/md/MarkdownBody';
import { Avatar } from '@/components/people/Avatar';
import {
  getProjectBySlug, getPapersByProject, getReleasesByProject, getMembersByProject,
} from '@/lib/mock';

export default async function ProjectOverview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const pinnedPaper = getPapersByProject(slug)[0];
  const latestRelease = getReleasesByProject(slug).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  const members = getMembersByProject(slug);

  const readme = `# ${project.name}\n\n${project.description}\n\n## Goals\n\n- TBD goals section (placeholder for lab README content).\n\n## How to run\n\n\`\`\`bash\n# example\npython scripts/run_eval.py --model claude-opus-4-7\n\`\`\`\n`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <div className="bg-white border border-border-default rounded-md p-6">
        <MarkdownBody source={readme} />
      </div>
      <aside className="space-y-4">
        <section className="bg-white border border-border-default rounded-md p-4">
          <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">About</h3>
          <p className="text-sm text-fg-default">{project.description}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
            <TagIcon size={14} />
            {project.tags.join(' · ')}
          </div>
        </section>
        <section className="bg-white border border-border-default rounded-md p-4">
          <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">Links</h3>
          <ul className="space-y-1 text-sm">
            {project.repos.map(r => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-accent-fg hover:underline inline-flex items-center gap-1">
                  <LinkExternalIcon size={12}/> {r.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
        {pinnedPaper && (
          <section className="bg-white border border-border-default rounded-md p-4">
            <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">Pinned paper</h3>
            <Link href={`/projects/${slug}/papers`} className="text-sm text-accent-fg hover:underline">{pinnedPaper.title}</Link>
            {pinnedPaper.venue && <p className="text-xs text-fg-muted mt-1">{pinnedPaper.venue}</p>}
          </section>
        )}
        {latestRelease && (
          <section className="bg-white border border-border-default rounded-md p-4">
            <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">Latest release</h3>
            <p className="text-sm"><b>{latestRelease.name}</b> {latestRelease.version}</p>
            <p className="text-xs text-fg-muted">{new Date(latestRelease.publishedAt).toDateString()}</p>
          </section>
        )}
        <section className="bg-white border border-border-default rounded-md p-4">
          <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">Contributors ({members.length})</h3>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <Link key={m.login} href={`/members/${m.login}`} title={m.displayName}>
                <Avatar login={m.login} size={24} />
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
```

- [ ] **Step 6: Run tests — expect pass**

Run: `pnpm test tests/smoke/project-detail.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "add project detail shell, header, tab bar, and Overview tab"
```

---

## Task 17: Project tabs — Papers, Data, Members

**Files:**
- Create: `app/projects/[slug]/papers/page.tsx`, `app/projects/[slug]/data/page.tsx`, `app/projects/[slug]/members/page.tsx`

- [ ] **Step 1: Implement Papers tab**

Create `app/projects/[slug]/papers/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import type { PaperStage } from '@/lib/types';
import { LabelChip } from '@/components/badges/LabelChip';
import { Avatar } from '@/components/people/Avatar';
import { EmptyState } from '@/components/misc/EmptyState';
import { getProjectBySlug, getPapersByProject } from '@/lib/mock';

const STAGE_LABELS: Record<PaperStage, string> = {
  idea: 'Idea', experiments: 'Running experiments', writing: 'Writing', review: 'Under review', published: 'Published',
};
const STAGE_TONE: Record<PaperStage, 'neutral' | 'attention' | 'accent' | 'done' | 'success'> = {
  idea: 'neutral', experiments: 'attention', writing: 'accent', review: 'done', published: 'success',
};
const STAGE_ORDER: PaperStage[] = ['idea', 'experiments', 'writing', 'review', 'published'];

export default async function PapersTab({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProjectBySlug(slug)) notFound();
  const papers = getPapersByProject(slug);
  if (papers.length === 0) return <EmptyState title="No papers yet" body="When you add papers to this project, they'll appear here." />;

  return (
    <div className="space-y-6">
      {STAGE_ORDER.map(stage => {
        const group = papers.filter(p => p.stage === stage);
        if (group.length === 0) return null;
        return (
          <section key={stage}>
            <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">{STAGE_LABELS[stage]}</h3>
            <ul className="bg-white border border-border-default rounded-md divide-y divide-border-muted">
              {group.map(p => (
                <li key={p.id} className="px-4 py-3 flex items-start gap-3">
                  <LabelChip tone={STAGE_TONE[stage]}>{STAGE_LABELS[stage]}</LabelChip>
                  <div className="flex-1">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-fg-muted mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        {p.authorLogins.map(l => <Avatar key={l} login={l} size={14} />)}
                      </span>
                      {p.venue && <span>· {p.venue}</span>}
                      {p.deadline && <span>· due {new Date(p.deadline).toDateString()}</span>}
                    </div>
                  </div>
                  {(p.pdfUrl ?? p.draftUrl) && (
                    <a href={p.pdfUrl ?? p.draftUrl} target="_blank" rel="noopener noreferrer" className="text-accent-fg text-xs hover:underline">
                      {p.pdfUrl ? 'PDF' : 'Draft'}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Implement Data tab**

Create `app/projects/[slug]/data/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import type { ReleaseKind } from '@/lib/types';
import { LabelChip } from '@/components/badges/LabelChip';
import { EmptyState } from '@/components/misc/EmptyState';
import { getProjectBySlug, getReleasesByProject } from '@/lib/mock';

const KIND_TONE: Record<ReleaseKind, 'neutral' | 'accent' | 'done' | 'success'> = {
  dataset: 'accent', tool: 'neutral', skill: 'done', model: 'success',
};

export default async function DataTab({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProjectBySlug(slug)) notFound();
  const releases = getReleasesByProject(slug).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  if (releases.length === 0) return <EmptyState title="No releases" body="Datasets, tools, and Claude Code skills released by this project show here." />;

  return (
    <ul className="bg-white border border-border-default rounded-md divide-y divide-border-muted">
      {releases.map(r => (
        <li key={r.id} className="px-4 py-3 flex items-start gap-3">
          <LabelChip tone={KIND_TONE[r.kind]}>{r.kind}</LabelChip>
          <div className="flex-1">
            <div className="font-medium">{r.name} <span className="text-fg-muted text-xs">{r.version}</span></div>
            {r.description && <p className="text-xs text-fg-muted mt-1">{r.description}</p>}
            <div className="text-xs text-fg-muted mt-1">Published {new Date(r.publishedAt).toDateString()}</div>
          </div>
          {r.downloadUrl && (
            <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-accent-fg text-xs hover:underline">Download</a>
          )}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Implement Members tab**

Create `app/projects/[slug]/members/page.tsx`:
```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar } from '@/components/people/Avatar';
import { LabelChip } from '@/components/badges/LabelChip';
import { getProjectBySlug, getMembersByProject } from '@/lib/mock';

export default async function MembersTab({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProjectBySlug(slug)) notFound();
  const members = getMembersByProject(slug);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {members.map(m => (
        <Link key={m.login} href={`/members/${m.login}`} className="bg-white border border-border-default rounded-md p-4 hover:border-accent-fg">
          <div className="flex items-center gap-3">
            <Avatar login={m.login} size={40} />
            <div>
              <div className="font-semibold text-sm">{m.displayName}</div>
              <div className="text-xs text-fg-muted">@{m.login}</div>
            </div>
            <LabelChip className="ml-auto">{m.role}</LabelChip>
          </div>
          {m.bio && <p className="text-xs text-fg-muted mt-2 line-clamp-2">{m.bio}</p>}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck
git add -A
git commit -m "add Papers, Data, Members tabs for project detail"
```

---

## Task 18: RunRow component + global Experiments page (F)

**Files:**
- Create: `components/runs/RunRow.tsx`, `app/experiments/page.tsx`, `tests/smoke/experiments.spec.ts`

- [ ] **Step 1: Write failing smoke test**

Create `tests/smoke/experiments.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('/experiments lists runs with status icons', async ({ page }) => {
  await page.goto('/experiments');
  await expect(page.getByRole('heading', { name: /Experiments/i })).toBeVisible();
  await expect(page.getByText('sweep-context-len #1428')).toBeVisible();
});
```

- [ ] **Step 2: Implement RunRow**

Create `components/runs/RunRow.tsx`:
```tsx
import Link from 'next/link';
import type { ExperimentRun } from '@/lib/types';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { Avatar } from '@/components/people/Avatar';
import { getProjectBySlug, getMemberByLogin } from '@/lib/mock';

function fmtDuration(sec?: number) {
  if (!sec) return '—';
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec/60)}m`;
  const h = Math.floor(sec/3600); const m = Math.round((sec%3600)/60);
  return `${h}h ${m}m`;
}
function relDate(iso: string, now = Date.now()) {
  const hours = Math.floor((now - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours/24)}d ago`;
}

export function RunRow({ run, hideProject = false }: { run: ExperimentRun; hideProject?: boolean }) {
  const proj = getProjectBySlug(run.projectSlug);
  const actor = getMemberByLogin(run.triggeredByLogin);
  return (
    <li className="px-4 py-3 flex items-center gap-3 border-b border-border-muted last:border-0">
      <StatusBadge status={run.status} />
      <div className="flex-1 min-w-0">
        <Link href={`/experiments/${run.id}`} className="font-medium text-sm text-fg-default hover:text-accent-fg truncate block">
          {run.name}
        </Link>
        <div className="text-xs text-fg-muted flex items-center gap-2 mt-0.5">
          {!hideProject && proj && (
            <Link href={`/projects/${proj.slug}`} className="hover:underline">{proj.name}</Link>
          )}
          <span className="flex items-center gap-1"><Avatar login={run.triggeredByLogin} size={12}/> {actor?.displayName ?? run.triggeredByLogin}</span>
        </div>
      </div>
      <div className="text-xs text-fg-muted text-right whitespace-nowrap">
        <div>{fmtDuration(run.durationSec)}</div>
        <div>{relDate(run.startedAt)}</div>
      </div>
    </li>
  );
}
```

- [ ] **Step 3: Implement global Experiments page**

Create `app/experiments/page.tsx`:
```tsx
import { RunRow } from '@/components/runs/RunRow';
import { experiments } from '@/lib/mock';

export default function ExperimentsIndex() {
  const runs = [...experiments].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Experiments</h1>
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span>Filters (placeholder):</span>
        <span className="px-2 py-1 bg-white border border-border-default rounded-md">Status</span>
        <span className="px-2 py-1 bg-white border border-border-default rounded-md">Project</span>
        <span className="px-2 py-1 bg-white border border-border-default rounded-md">Actor</span>
      </div>
      <ul className="bg-white border border-border-default rounded-md">
        {runs.map(r => <RunRow key={r.id} run={r} />)}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test + commit**

```bash
pnpm test tests/smoke/experiments.spec.ts
git add -A
git commit -m "add RunRow and global Experiments page"
```

---

## Task 19: Experiment run detail page + project Experiments tab

**Files:**
- Create: `app/experiments/[id]/page.tsx`, `app/projects/[slug]/experiments/page.tsx`

- [ ] **Step 1: Implement run detail stub**

Create `app/experiments/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { Avatar } from '@/components/people/Avatar';
import { getProjectBySlug, getMemberByLogin, getRunById } from '@/lib/mock';

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getRunById(id);
  if (!run) notFound();
  const proj = getProjectBySlug(run.projectSlug);
  const actor = getMemberByLogin(run.triggeredByLogin);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border-muted">
        <StatusBadge status={run.status} showLabel />
        <h1 className="text-lg font-semibold">{run.name}</h1>
        <div className="ml-auto text-xs text-fg-muted flex items-center gap-3">
          <span className="flex items-center gap-1"><Avatar login={run.triggeredByLogin} size={14}/> {actor?.displayName}</span>
          <span>{new Date(run.startedAt).toLocaleString()}</span>
        </div>
      </div>
      {proj && (
        <div className="text-sm">Project: <Link href={`/projects/${proj.slug}`} className="text-accent-fg hover:underline">{proj.name}</Link></div>
      )}
      {run.summary && (
        <div className="bg-white border border-border-default rounded-md p-4 text-sm">{run.summary}</div>
      )}
      <section>
        <h2 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">Steps</h2>
        <ul className="bg-white border border-border-default rounded-md divide-y divide-border-muted">
          {(run.stepsMock ?? [{ name: 'run', status: run.status }]).map((s, i) => (
            <li key={i} className="px-4 py-2 flex items-center gap-3">
              <StatusBadge status={s.status} />
              <span className="font-medium">{s.name}</span>
              {s.logSnippet && <code className="ml-auto text-xs bg-canvas-inset px-2 py-1 rounded">{s.logSnippet}</code>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Implement project Experiments tab (reuses RunRow)**

Create `app/projects/[slug]/experiments/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { RunRow } from '@/components/runs/RunRow';
import { EmptyState } from '@/components/misc/EmptyState';
import { getProjectBySlug, getRunsByProject } from '@/lib/mock';

export default async function ProjectExperiments({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProjectBySlug(slug)) notFound();
  const runs = getRunsByProject(slug).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  if (runs.length === 0) return <EmptyState title="No runs yet" />;
  return (
    <ul className="bg-white border border-border-default rounded-md">
      {runs.map(r => <RunRow key={r.id} run={r} hideProject />)}
    </ul>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add -A
git commit -m "add experiment run detail and project Experiments tab"
```

---

## Task 20: Pipeline (Kanban) page

**Files:**
- Create: `components/kanban/KanbanBoard.tsx`, `components/kanban/KanbanColumn.tsx`, `components/kanban/KanbanCard.tsx`, `app/pipeline/page.tsx`, `tests/smoke/pipeline.spec.ts`

- [ ] **Step 1: Write failing test**

Create `tests/smoke/pipeline.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('/pipeline renders kanban columns', async ({ page }) => {
  await page.goto('/pipeline');
  await expect(page.getByRole('heading', { name: 'Pipeline' })).toBeVisible();
  for (const col of ['Idea', 'Running experiments', 'Writing', 'Under review', 'Published']) {
    await expect(page.getByText(col, { exact: false })).toBeVisible();
  }
});
```

- [ ] **Step 2: Implement KanbanCard**

Create `components/kanban/KanbanCard.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import type { Paper } from '@/lib/types';
import { AvatarStack } from '@/components/people/AvatarStack';
import { LabelChip } from '@/components/badges/LabelChip';
import { getProjectBySlug } from '@/lib/mock';

function daysUntil(iso?: string, now = Date.now()) {
  if (!iso) return null;
  const d = Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
  return d >= 0 ? `in ${d}d` : `${-d}d ago`;
}

export function KanbanCard({ paper }: { paper: Paper }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: paper.id });
  const proj = getProjectBySlug(paper.projectSlug);
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`bg-white border border-border-default rounded-md p-3 cursor-grab select-none shadow-sm ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="font-medium text-sm leading-tight">{paper.title}</div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        {paper.venue ? <LabelChip tone="accent">{paper.venue}</LabelChip> : <span />}
        {paper.deadline && <span className="text-fg-muted">{daysUntil(paper.deadline)}</span>}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <AvatarStack logins={paper.authorLogins} size={18} />
        {proj && <Link href={`/projects/${proj.slug}`} className="text-xs text-fg-muted hover:text-accent-fg">{proj.name}</Link>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement KanbanColumn**

Create `components/kanban/KanbanColumn.tsx`:
```tsx
'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Paper, PaperStage } from '@/lib/types';
import { KanbanCard } from './KanbanCard';

export function KanbanColumn({ stage, label, papers }: { stage: PaperStage; label: string; papers: Paper[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 bg-canvas-inset rounded-md p-3 min-w-[260px] ${isOver ? 'ring-2 ring-accent-fg' : ''}`}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-fg-muted font-semibold">
        <span>{label}</span>
        <span className="bg-white border border-border-default rounded-full px-1.5 py-0.5 text-[10px]">{papers.length}</span>
      </div>
      {papers.map(p => <KanbanCard key={p.id} paper={p} />)}
    </div>
  );
}
```

- [ ] **Step 4: Implement KanbanBoard (client state for drag)**

Create `components/kanban/KanbanBoard.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { Paper, PaperStage } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';

const COLUMNS: { stage: PaperStage; label: string }[] = [
  { stage: 'idea', label: 'Idea' },
  { stage: 'experiments', label: 'Running experiments' },
  { stage: 'writing', label: 'Writing' },
  { stage: 'review', label: 'Under review' },
  { stage: 'published', label: 'Published' },
];

export function KanbanBoard({ initial }: { initial: Paper[] }) {
  const [items, setItems] = useState(initial);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    const paperId = e.active.id as string;
    const stage = e.over?.id as PaperStage | undefined;
    if (!stage) return;
    setItems(prev => prev.map(p => p.id === paperId ? { ...p, stage } : p));
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(c => (
          <KanbanColumn key={c.stage} stage={c.stage} label={c.label} papers={items.filter(p => p.stage === c.stage)} />
        ))}
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 5: Implement Pipeline page**

Create `app/pipeline/page.tsx`:
```tsx
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { DeadlineList } from '@/components/misc/DeadlineList';
import { papers, getUpcomingVenues } from '@/lib/mock';

export default function PipelinePage() {
  const venues = getUpcomingVenues();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <div>
        <h1 className="text-lg font-semibold mb-4">Pipeline</h1>
        <KanbanBoard initial={papers} />
      </div>
      <div>
        <DeadlineList venues={venues} title="Venue deadlines" />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run test + commit**

```bash
pnpm test tests/smoke/pipeline.spec.ts
git add -A
git commit -m "add Pipeline Kanban page with drag-and-drop"
```

---

## Task 21: Discussions list and detail

**Files:**
- Create: `components/discussions/DiscussionRow.tsx`, `app/discussions/page.tsx`, `app/discussions/[id]/page.tsx`, `tests/smoke/discussions.spec.ts`

- [ ] **Step 1: Write failing test**

Create `tests/smoke/discussions.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('/discussions lists categories and threads', async ({ page }) => {
  await page.goto('/discussions');
  await expect(page.getByText('Announcements')).toBeVisible();
  await expect(page.getByText('Journal Club')).toBeVisible();
  await expect(page.getByRole('link', { name: /Group meeting moved/ })).toBeVisible();
});

test('discussion detail renders body and replies', async ({ page }) => {
  await page.goto('/discussions/d-001');
  await expect(page.getByRole('heading', { name: /Group meeting moved/ })).toBeVisible();
  await expect(page.getByText('Slides ready by Thu night')).toBeVisible();
});
```

- [ ] **Step 2: Implement DiscussionRow**

Create `components/discussions/DiscussionRow.tsx`:
```tsx
import Link from 'next/link';
import type { Discussion } from '@/lib/types';
import { Avatar } from '@/components/people/Avatar';
import { LabelChip } from '@/components/badges/LabelChip';
import { CommentIcon } from '@primer/octicons-react';

const CATEGORY_LABEL: Record<Discussion['category'], string> = {
  announcements: 'Announcements', journal_club: 'Journal Club', qa: 'Q&A', ideas: 'Ideas',
};
const CATEGORY_TONE: Record<Discussion['category'], 'neutral' | 'accent' | 'done' | 'attention'> = {
  announcements: 'attention', journal_club: 'accent', qa: 'neutral', ideas: 'done',
};

function rel(iso: string, now = Date.now()) {
  const h = Math.floor((now - new Date(iso).getTime()) / 3_600_000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

export function DiscussionRow({ discussion }: { discussion: Discussion }) {
  return (
    <li className="px-4 py-3 flex items-center gap-3 border-b border-border-muted last:border-0">
      <Avatar login={discussion.authorLogin} size={28} />
      <div className="flex-1 min-w-0">
        <Link href={`/discussions/${discussion.id}`} className="font-medium text-sm hover:text-accent-fg">{discussion.title}</Link>
        <div className="text-xs text-fg-muted mt-0.5 flex items-center gap-2">
          <LabelChip tone={CATEGORY_TONE[discussion.category]}>{CATEGORY_LABEL[discussion.category]}</LabelChip>
          <span>@{discussion.authorLogin}</span>
          <span>· opened {rel(discussion.createdAt)}</span>
        </div>
      </div>
      <div className="text-xs text-fg-muted whitespace-nowrap flex items-center gap-1">
        <CommentIcon size={12} /> {discussion.replyCount}
      </div>
    </li>
  );
}
```

- [ ] **Step 3: Implement Discussions index**

Create `app/discussions/page.tsx`:
```tsx
import type { DiscussionCategory } from '@/lib/types';
import { DiscussionRow } from '@/components/discussions/DiscussionRow';
import { discussions } from '@/lib/mock';

const CATEGORIES: { id: DiscussionCategory; label: string; icon: string }[] = [
  { id: 'announcements', label: 'Announcements', icon: '📣' },
  { id: 'journal_club',  label: 'Journal Club',  icon: '📚' },
  { id: 'qa',            label: 'Q&A',           icon: '❓' },
  { id: 'ideas',         label: 'Ideas',         icon: '💡' },
];

export default function DiscussionsIndex() {
  const sorted = [...discussions].sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <aside className="bg-white border border-border-default rounded-md p-3 h-fit">
        <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">Categories</h3>
        <ul className="space-y-1 text-sm">
          {CATEGORIES.map(c => {
            const count = discussions.filter(d => d.category === c.id).length;
            return (
              <li key={c.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-canvas-subtle">
                <span>{c.icon} {c.label}</span>
                <span className="text-xs text-fg-muted">{count}</span>
              </li>
            );
          })}
        </ul>
      </aside>
      <section>
        <h1 className="text-lg font-semibold mb-3">Discussions</h1>
        <ul className="bg-white border border-border-default rounded-md">
          {sorted.map(d => <DiscussionRow key={d.id} discussion={d} />)}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Implement Discussion detail**

Create `app/discussions/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { MarkdownBody } from '@/components/md/MarkdownBody';
import { Avatar } from '@/components/people/Avatar';
import { getDiscussionById, getMemberByLogin } from '@/lib/mock';

export default async function DiscussionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = getDiscussionById(id);
  if (!d) notFound();
  const author = getMemberByLogin(d.authorLogin);

  return (
    <article className="max-w-3xl space-y-6">
      <header className="pb-3 border-b border-border-muted">
        <h1 className="text-xl font-semibold">{d.title}</h1>
        <div className="text-xs text-fg-muted mt-2 flex items-center gap-2">
          <Avatar login={d.authorLogin} size={18} /> <b>{author?.displayName ?? d.authorLogin}</b>
          · {new Date(d.createdAt).toLocaleString()}
        </div>
      </header>

      <div className="bg-white border border-border-default rounded-md p-4">
        <MarkdownBody source={d.bodyMarkdown} />
      </div>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wide text-fg-muted font-semibold">{d.replies.length} replies</h2>
        {d.replies.map((r, i) => {
          const m = getMemberByLogin(r.authorLogin);
          return (
            <div key={i} className="bg-white border border-border-default rounded-md p-4">
              <div className="text-xs text-fg-muted mb-2 flex items-center gap-2">
                <Avatar login={r.authorLogin} size={16} /> <b>{m?.displayName ?? r.authorLogin}</b> · {new Date(r.createdAt).toLocaleString()}
              </div>
              <MarkdownBody source={r.bodyMarkdown} />
            </div>
          );
        })}
      </section>
    </article>
  );
}
```

- [ ] **Step 5: Run test + commit**

```bash
pnpm test tests/smoke/discussions.spec.ts
git add -A
git commit -m "add Discussions list, detail, and DiscussionRow"
```

---

## Task 22: Member profile stub

**Files:**
- Create: `app/members/[login]/page.tsx`, `tests/smoke/member.spec.ts`

- [ ] **Step 1: Write failing test**

Create `tests/smoke/member.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('member profile renders', async ({ page }) => {
  await page.goto('/members/dgu');
  await expect(page.getByRole('heading', { name: 'Dongyu' })).toBeVisible();
  await expect(page.getByText('PhD')).toBeVisible();
});
```

- [ ] **Step 2: Implement profile stub**

Create `app/members/[login]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/people/Avatar';
import { LabelChip } from '@/components/badges/LabelChip';
import { getMemberByLogin, getProjectBySlug } from '@/lib/mock';

export default async function MemberProfile({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const m = getMemberByLogin(login);
  if (!m) notFound();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <aside className="bg-white border border-border-default rounded-md p-4 text-center">
        <div className="flex justify-center"><Avatar login={m.login} size={120} /></div>
        <h1 className="text-lg font-semibold mt-3">{m.displayName}</h1>
        <div className="text-sm text-fg-muted">@{m.login}</div>
        <div className="mt-2"><LabelChip>{m.role}</LabelChip></div>
        {m.bio && <p className="text-sm text-fg-muted mt-3 leading-5">{m.bio}</p>}
      </aside>
      <section>
        <h2 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">Pinned projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {m.pinnedProjectSlugs.map(s => {
            const p = getProjectBySlug(s);
            if (!p) return null;
            return (
              <Link key={s} href={`/projects/${s}`} className="bg-white border border-border-default rounded-md p-4 hover:border-accent-fg">
                <div className="font-semibold text-accent-fg">{p.name}</div>
                <p className="text-xs text-fg-muted mt-1 line-clamp-2">{p.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Test + commit**

```bash
pnpm test tests/smoke/member.spec.ts
git add -A
git commit -m "add member profile stub page"
```

---

## Task 23: Full smoke pass, type check, and build

**Files:**
- Create: `tests/smoke/all-routes.spec.ts`

- [ ] **Step 1: Add route-coverage smoke test**

Create `tests/smoke/all-routes.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

const routes = [
  '/',
  '/projects',
  '/projects/reasoning-bench-v2',
  '/projects/reasoning-bench-v2/experiments',
  '/projects/reasoning-bench-v2/papers',
  '/projects/reasoning-bench-v2/data',
  '/projects/reasoning-bench-v2/members',
  '/pipeline',
  '/experiments',
  '/experiments/exp-1428',
  '/discussions',
  '/discussions/d-001',
  '/members/dgu',
];

for (const route of routes) {
  test(`${route} returns 200`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status(), `status for ${route}`).toBe(200);
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForLoadState('networkidle');
    expect(errors, `runtime errors on ${route}`).toEqual([]);
  });
}
```

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 3: Type-check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Production build**

Run: `pnpm build`
Expected: build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "add full-route smoke test and verify build"
```

---

## Self-review (run during implementation, before declaring done)

1. **Spec coverage check:** walk through the spec sections and confirm each has tasks:
   - §7 IA routes → Tasks 11 (TopNav), 14 (/), 15 (/projects), 16–17 + 19 (/projects/[slug]/*), 20 (/pipeline), 18–19 (/experiments*), 21 (/discussions*), 22 (/members/[login]).
   - §8 page specs → Tasks 14, 16–22.
   - §9 components → Tasks 9, 10, 11, 12, 13, 16, 18, 20, 21.
   - §10 data model → Tasks 4–8.
   - §12 mock content volumes → Tasks 5–7 (12 members, 6 projects, 15 papers, 25 experiments, 10 discussions, 8 releases, 12 events, 7 venues).
   - §13 acceptance criteria → Task 23.

2. **Placeholder scan:** no "TBD", no "implement later", no "add appropriate error handling". Every code step shows full code.

3. **Type consistency:** `RunStatus` values (`success`/`failure`/`in_progress`/`queued`/`cancelled`) used identically in types, mock, `StatusBadge`, and `RunRow`. `PaperStage` consistent between types, mock, Pipeline columns, and Papers tab.

4. **Ambiguity check:** dev port pinned to 3000, Next.js App Router `params` handled as `Promise` (v15 convention), auth explicitly absent.

---

Plan complete.
