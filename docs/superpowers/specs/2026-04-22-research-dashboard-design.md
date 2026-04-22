# Research Dashboard — Design Spec

**Date:** 2026-04-22
**Working name:** LabHub (placeholder — replace at implementation time)
**Status:** Design approved, ready for implementation plan

## 1. Summary

A GitHub-styled internal dashboard for an LLM research lab (10–13 members). The UI borrows GitHub's visual language and information architecture (Primer palette, top nav, repository-tabs pattern) and repurposes it for research artifacts: papers, code repos, open-source tools (e.g. Claude Code skills), datasets, experiments, and discussions.

This spec covers the **UI shell and page layouts** populated with static mock data. Backend integration, authentication, search, and real data connectors are out of scope for this iteration and will be added in later phases.

## 2. Goals

- Ship a navigable 5-page UI that looks and feels like GitHub, with LLM-research content.
- Set up a component and data-model foundation that later phases can plug real data into without UI rework.
- Keep the project structure small enough that a single engineer can extend any page in isolation.

## 3. Non-goals

- Real authentication, permissions, or multi-tenancy.
- Database, ORM, or API routes.
- Search engine, realtime updates, notifications.
- Dark mode, mobile layouts, i18n.
- Live integrations with GitHub / arXiv / HuggingFace / Slack.
- Pixel-perfect reproduction of github.com (visual *language* only, not cloning).

## 4. Users and access model

- **Primary users:** 10–13 lab members.
- **Access model for MVP:** no auth. Deployed at a private domain; treat all viewers as authenticated. A single hard-coded "current user" in mock data drives any user-specific UI (avatar in top nav, "pinned by me" state). Auth is a post-MVP concern.
- **Viewing context:** content is internal but can be viewed openly inside the lab's domain — no separate public/private split in the UI.

## 5. Tech stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui primitives, restyled with Primer-ish tokens
- **Icons:** `@primer/octicons-react`
- **Markdown:** `react-markdown` + `remark-gfm` (for Overview and Discussion bodies)
- **Data:** static TypeScript modules under `lib/mock/*.ts`. Typed with interfaces declared in `lib/types.ts`. A later `lib/api/*` layer will swap fetchers without touching pages/components.
- **Deployment target:** Vercel or any Node host; not decided in MVP.

**Why Next.js over Vite:** multi-page routing maps cleanly to the 5 pages; App Router gives us layouts (shared top nav / sidebars) for free; leaves room to add Server Components or API routes when real data arrives without a rewrite.

## 6. Visual system

- **Palette:** Primer light (canvas `#ffffff`, subtle `#f6f8fa`, border `#d0d7de`, fg `#1f2328`, muted `#656d76`, accent blue `#0969da`, success `#1a7f37`, danger `#cf222e`, attention `#9a6700`). Encoded as Tailwind theme tokens (`bg-canvas`, `text-fg-muted`, etc).
- **Type:** system UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", …`) + `ui-monospace, SFMono-Regular, …` for code.
- **Density:** match GitHub — compact list rows (~32–40px), 12–14px body text, thin separators.
- **Scope:** light theme only this iteration. Color tokens chosen so a dark theme can be added later via a CSS variable swap.

## 7. Information architecture (routes)

```
/                    Dashboard (home)
/projects            Projects index (list/filter)
/projects/[slug]     Project detail — tabs: Overview | Experiments | Papers | Data | Members
/pipeline            Kanban (paper submission pipeline)
/experiments         Experiment runs (GitHub Actions-style, global list)
/discussions         Discussions index (category + thread list)
/discussions/[id]    Discussion thread detail
/members/[login]     Member profile (stub: avatar, role, bio, pinned projects). Linked from B · Members.
```

**Top nav (persistent, all routes):**

- Left: LabHub logo → `/`
- Search input (placeholder only in MVP — no search backend)
- Nav links: **Experiments · Pipeline · Discussions**
- Right: `+` menu (New project / New paper / New experiment / New discussion — placeholder handlers), avatar menu (Profile / Settings — placeholder)

## 8. Page specs

### 8.1 Dashboard `/` (A)

**Layout:** two-row grid.

- **Row 1 (above the fold):** two columns.
  - Left (flex-1): "Pinned projects" section — 3-column card grid (responsive: 3 → 2 → 1 col). Last card is "+ New project". Each card: name + Octicon, 1–2 line description, tag chips (e.g. `LLM`, `benchmark`, `korean`).
  - Right (320px fixed): "Upcoming" panel — deadlines (conference due dates), meetings (group meeting, 1:1s), each with relative time ("in 12 days").
- **Row 2 (below):** full-width "Recent activity" feed. Items are typed: `paper`, `experiment`, `release`, `discussion`, `project`. Each row: colored type badge + actor avatar + one-line sentence + project link + relative timestamp.

### 8.2 Project detail `/projects/[slug]` (B)

**Header:** project name (with ◆ Octicon), Star/Watch/Fork-style buttons (visual only), one-line description, topic tag chips.

**Tab bar (GitHub repo-nav style, Octicon + label):**

1. **Overview** — `README`-style Markdown body pulled from mock; pinned paper card; quick links.
2. **Experiments** — filtered Actions-style list scoped to this project (reuses `<RunRow>` from F).
3. **Papers** — list of papers tied to this project, grouped by stage (Idea / Writing / Under review / Published). Each row: title, authors, venue, stage badge, draft/PDF link.
4. **Data** — dataset releases (name, version, size, published date, download link). Also surfaces open-source tool releases (including Claude Code skills) with a `kind` badge.
5. **Members** — avatar grid of contributors with role chips (PI / Postdoc / PhD / Intern), linking to `/members/[login]`.

**Right sidebar (all tabs except full-width ones):** About (description + topics), Links (GitHub, HuggingFace, arXiv IDs), Latest release, Contributors (avatar stack).

### 8.3 Pipeline `/pipeline` (E)

**Layout:** 4–5 column Kanban board, full-width, horizontal scroll on small screens.

**Columns:** `Idea` → `Running experiments` → `Writing` → `Under review` → `Published`

**Card:** paper title, target venue chip (e.g. `NeurIPS '26`), deadline (relative), assignee avatars, link to owning project. Drag-and-drop is **visual only** in MVP — dropping updates local component state, no persistence.

**Right rail (collapsible on narrow widths):** "Upcoming venue deadlines" — sortable list of conferences with countdown.

### 8.4 Experiments `/experiments` (F)

**Layout:** Actions-style list page.

- **Filter bar:** status (all / success / failure / in progress / cancelled), project, actor, date range.
- **List rows:** status icon (Octicon `check-circle-fill` / `x-circle-fill` / `dot-fill` animated / `stop`), run name (e.g. `sweep-context-len #1428`), project slug, triggered-by avatar + action (`minji ran on main`), duration, started-at.
- **Detail route** (`/experiments/[id]` — linked but stubbed in MVP): header with status/duration/trigger, collapsible step log sections (mock text logs), artifacts list.

### 8.5 Discussions `/discussions` (H)

**Layout:** two-column.

- **Left sidebar (220px):** category list with counts — 📣 Announcements · 📚 Journal Club · ❓ Q&A · 💡 Ideas.
- **Main:** thread rows — title (link), author avatar + login, category chip, reply count, last-activity relative time, small excerpt on hover/second line.
- **Detail** (`/discussions/[id]`): Markdown body + threaded replies (one level of nesting; deeper nesting deferred).

## 9. Shared components

Declared under `components/`:

| Component | Purpose |
|---|---|
| `TopNav` | persistent header (logo, search, nav links, +menu, avatar) |
| `PageShell` | layout wrapper with top nav + optional sidebar slots |
| `ProjectCard` | dashboard grid card |
| `ProjectHeader` | B-page header (name/desc/tags/action buttons) |
| `TabBar` | generic tabs (used by B) |
| `ActivityFeedItem` | typed feed row with icon + sentence |
| `StatusBadge` | success/failure/in-progress/queued |
| `LabelChip` | tag/topic/category pill |
| `Avatar` / `AvatarStack` | member avatars |
| `KanbanBoard`, `KanbanColumn`, `KanbanCard` | Pipeline page |
| `RunRow` | Experiments list row |
| `DiscussionRow` | Discussions list row |
| `MarkdownBody` | Overview, discussion detail |
| `DeadlineList` | dashboard "Upcoming" + pipeline venues rail |
| `EmptyState` | when a tab has no items |

Component files are colocated with a small Storybook-esque playground page later if useful; not required for MVP.

## 10. Data model (types)

Declared in `lib/types.ts`. Mock fixtures in `lib/mock/{projects,papers,experiments,members,discussions,events,releases,venues}.ts`.

```ts
type Slug = string;   type UserLogin = string;

interface Project {
  slug: Slug;
  name: string;
  description: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;   // ISO
  updatedAt: string;
  memberLogins: UserLogin[];
  repos: { label: string; url: string }[];   // GitHub links
  paperIds: string[];
  releaseIds: string[];
}

type PaperStage = 'idea' | 'experiments' | 'writing' | 'review' | 'published';

interface Paper {
  id: string;
  title: string;
  authorLogins: UserLogin[];
  projectSlug: Slug;
  stage: PaperStage;
  venue?: string;           // e.g. "NeurIPS 2026"
  deadline?: string;        // ISO
  draftUrl?: string;
  pdfUrl?: string;
}

type RunStatus = 'success' | 'failure' | 'in_progress' | 'queued' | 'cancelled';

interface ExperimentRun {
  id: string;
  name: string;             // e.g. "sweep-context-len #1428"
  projectSlug: Slug;
  status: RunStatus;
  startedAt: string;
  durationSec?: number;
  triggeredByLogin: UserLogin;
  summary?: string;
  stepsMock?: { name: string; status: RunStatus; logSnippet?: string }[];
}

type MemberRole = 'PI' | 'Postdoc' | 'PhD' | 'MS' | 'Intern' | 'Alumni';

interface Member {
  login: UserLogin;
  displayName: string;
  role: MemberRole;
  avatarUrl?: string;
  bio?: string;
  pinnedProjectSlugs: Slug[];
}

type DiscussionCategory = 'announcements' | 'journal_club' | 'qa' | 'ideas';

interface Discussion {
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

type ReleaseKind = 'dataset' | 'tool' | 'skill' | 'model';

interface Release {
  id: string;
  name: string;
  kind: ReleaseKind;
  projectSlug: Slug;
  version: string;
  publishedAt: string;
  description?: string;
  downloadUrl?: string;
}

type EventType = 'paper' | 'experiment' | 'release' | 'discussion' | 'project';

interface ActivityEvent {
  id: string;
  type: EventType;
  actorLogin: UserLogin;
  projectSlug?: Slug;
  payload: Record<string, unknown>;   // shape depends on type
  createdAt: string;
}

interface Venue {
  id: string;
  name: string;           // "NeurIPS 2026"
  deadline: string;       // ISO
  kind: 'abstract' | 'full' | 'camera_ready' | 'rebuttal';
}
```

## 11. Directory structure

```
app/
  layout.tsx                 # TopNav + page shell
  page.tsx                   # Dashboard
  projects/
    page.tsx                 # Projects index
    [slug]/
      layout.tsx             # ProjectHeader + TabBar
      page.tsx               # Overview tab (default)
      experiments/page.tsx
      papers/page.tsx
      data/page.tsx
      members/page.tsx
  pipeline/page.tsx
  experiments/
    page.tsx
    [id]/page.tsx
  discussions/
    page.tsx
    [id]/page.tsx
  members/[login]/page.tsx
components/
  nav/ TopNav.tsx
  shell/ PageShell.tsx
  project/ ProjectCard.tsx ProjectHeader.tsx TabBar.tsx
  feed/ ActivityFeedItem.tsx
  badges/ StatusBadge.tsx LabelChip.tsx
  people/ Avatar.tsx AvatarStack.tsx
  kanban/ KanbanBoard.tsx KanbanColumn.tsx KanbanCard.tsx
  runs/ RunRow.tsx
  discussions/ DiscussionRow.tsx
  md/ MarkdownBody.tsx
  misc/ DeadlineList.tsx EmptyState.tsx
lib/
  types.ts
  mock/
    projects.ts papers.ts experiments.ts members.ts
    discussions.ts releases.ts events.ts venues.ts
    index.ts                 # re-exports + helper queries
  theme/ tokens.ts           # Primer-ish color tokens
public/
  avatars/ ...               # placeholder avatars
```

## 12. Mock content to seed

- **6 projects** (at least one example of each artifact mix): `reasoning-bench-v2`, `claude-skill-suite`, `alignment-probes`, `long-context-eval`, `KoLogicQA`, plus one more `agentic-tool-use`.
- **~15 papers** across the 5 stages.
- **~25 experiment runs** spanning all statuses.
- **12 members** with realistic lab roles (1 PI, 2 postdocs, 6–7 PhDs, 2–3 MS/Interns).
- **~10 discussions** across 4 categories.
- **~8 releases** (datasets / tools / Claude skills).
- **~6 venues** (NeurIPS 2026, ICML 2026, ACL 2026, EMNLP, ICLR, COLM) with deadlines in the near future.

## 13. Acceptance criteria

- The five primary pages from the scope decision render populated with mock data: Dashboard `/` (A), Project detail `/projects/[slug]` (B), Pipeline `/pipeline` (E), Experiments `/experiments` (F), Discussions `/discussions` (H).
- Supporting routes render with mock data: Projects index `/projects`, Discussion detail `/discussions/[id]`, Experiment run detail `/experiments/[id]`, Member profile `/members/[login]`. These exist so in-app links are never broken; their scope is lightweight (no filter/sort/pagination required).
- All five tabs on `/projects/[slug]` (Overview, Experiments, Papers, Data, Members) switch via nested App Router routes.
- Top nav links navigate between pages without full-page reload.
- No broken links within the app. Every internal link resolves to a rendering route; external links open in a new tab with `rel="noopener noreferrer"`.
- Passes `tsc --noEmit` and `next build` cleanly.
- `pnpm dev` launches and every route listed above returns 200 in a smoke-test.

## 14. Phased execution (post-plan)

Later implementation plan should sequence roughly as: (1) scaffold + theme + TopNav; (2) types + mock data; (3) Dashboard (A); (4) Projects index + Project detail shell (B); (5) Project tabs filled in; (6) Experiments (F); (7) Pipeline (E); (8) Discussions (H); (9) Members profile stub; (10) smoke test + cleanup. Exact breakdown belongs in the implementation plan, not here.
