# LabHub Skill

A Claude Code skill that wraps [LabHub](https://labhub.damilab.cc)'s REST
API. After install, `/labhub <natural-language>` lets you log experiment
runs and authenticate via GitHub Device Flow without leaving your chat.

## Install

```bash
# From the research_dashboard repo root:
cp -r skills/labhub ~/.claude/skills/
```

That's it. Claude Code auto-discovers skills under `~/.claude/skills/`.
Type `/labhub login` in any Claude Code session to start.

## Admin setup (one-time per LabHub deployment)

If you're the lab admin distributing this skill for the first time:

1. Create a GitHub OAuth App at
   https://github.com/settings/applications/new:
   - **Application name:** `LabHub CLI`
   - **Homepage URL:** `https://labhub.damilab.cc`
   - **Authorization callback URL:** `https://labhub.damilab.cc`
     (unused for Device Flow but GitHub requires the field)
   - **Enable Device Flow:** ✅
2. Copy the **Client ID** from the OAuth App page (the `Ov23li…`
   string — it's public, safe to commit).
3. Open `skills/labhub/SKILL.md` and replace
   `REPLACE_WITH_GITHUB_CLIENT_ID` with that value.
4. Commit and push.
5. Lab members pull and re-`cp -r` to update.

## Usage

| You say | What happens |
|---|---|
| `/labhub login` | Opens GitHub Device Flow. Enter the printed code in your browser, click Authorize. JWT saved for 30 days. |
| `/labhub me` | Verifies the saved token and shows your LabHub identity. |
| `/labhub start a run for klass-unlearning called temp-sweep` | POSTs to `/api/runs`. Prints the new run id and project URL. |
| `/labhub the run finished, 1h, success` | PATCHes the run from this conversation to `success` with `durationSec=3600`. |
| `/labhub logout` | Deletes the local token. |

You can speak Korean or English; the skill handles both. The agent only
remembers "the run" within a single Claude Code session — across sessions,
say the run id explicitly (e.g., `/labhub mark exp-te35xn as failure`).

## Token storage

The skill writes `~/.config/labhub/token.json` (mode `0600`, owner-only).
The file contains a 30-day JWT plus the member identity. Wipe it any
time with `/labhub logout` or `rm ~/.config/labhub/token.json` — the next
API call will prompt you to re-login.

## Dev override

Pointing the skill at a non-prod LabHub for testing:

```bash
LABHUB_URL=http://localhost:3000 claude
```

Inside that session, `/labhub …` will hit `localhost:3000` instead of
`labhub.damilab.cc`. Note the JWT secret is per-deployment, so you'll
need to re-login when switching back to prod.

## Files

```
skills/labhub/
├── SKILL.md                 # LLM instructions (auto-loaded by Claude Code)
├── README.md                # this file
└── scripts/
    ├── device-flow.sh       # GitHub Device Flow polling loop
    └── device-flow.test.sh  # bash test against a fake GH/LabHub server
```

## Troubleshooting

**"Cannot reach LabHub" error** — the skill tried to hit
`https://labhub.damilab.cc` and failed. Check VPN / domain status. If
you're on a dev environment, set `LABHUB_URL` to the right URL.

**Stuck on "Waiting for authorization…"** — make sure you opened
https://github.com/login/device, typed the printed code, and clicked
Authorize. The polling loop times out after about 15 minutes.

**`/labhub login` says GitHub rejected the token** — the server-side
OAuth App's client_id is probably mis-set in `SKILL.md`. Compare the
value there to the actual OAuth App page on GitHub.

## Roadmap (later phases)

- Phase 3: `/labhub release …`, `/labhub paper …` (need new POST endpoints).
- Phase 4: `/labhub list runs` (need GET-list endpoints).
- Phase 5: Auto-link runs to journal entries.
