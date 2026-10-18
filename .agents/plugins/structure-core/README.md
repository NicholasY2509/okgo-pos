# structure-core

Stack-agnostic project governance for Claude Code.

The plugin encodes one idea: **a project's durable knowledge belongs in the repository, not in
a session.** Four artifacts carry it, and the plugin keeps them true.

| Artifact | Answers | Kept true by |
| --- | --- | --- |
| `CODINGSTYLE.md` | What stack is this, and how do we write code here? | `project-governance` |
| `DESIGN.md` | What are the typography, color, and spacing rules? | `design-tokens` |
| `LOG.md` | What happened recently, and where was I? | `session-log` |
| `docs/adr/` | Why is it built this way? | `adr-workflow` |

## Commands

| Command | Does |
| --- | --- |
| `/st-init` | Create `CLAUDE.md` from a requirements interview, then bootstrap the four artifacts — detects the stack, interviews only for what code cannot answer |
| `/st-status` | Read-only governance health report: drift, staleness, unfilled placeholders |
| `/st-adr` | Draft an ADR, confirm it with the user, then implement |
| `/st-log` | Append this session's durable outcome to `LOG.md`, compact when due |
| `/st-check` | Run the repo's real format, lint, typecheck, and test commands |
| `/st-commit` | Verify, scan for clutter, then make atomic commits with Conventional Commit messages |
| `/st-design` | Convert pasted Figma CSS into project tokens, or update `DESIGN.md` |
| `/st-clean` | Inventory one-off scripts and debug leftovers, clean with approval |

### `/st-init` vs. `/st-status`

Both concern the four artifacts, and they are the pair most often confused:

- **`/st-init`** creates them. Once per repo. Starts with `CLAUDE.md` — asks for the project's
  requirements and confirms repo details — then detects the stack, interviews only for what the
  code cannot answer, fills every placeholder, then verifies the command table it wrote.
- **`/st-status`** reads them. Any time. Reports drift, staleness, unfilled placeholders, and
  dangling log threads. Changes nothing.

Missing artifacts → `/st-init`. Existing artifacts you no longer trust → `/st-status`.

## Skills

Skills are **knowledge, not actions**. You never type them — they load on their own when the
work matches their description, and none of them has a slash command. The commands above are
jobs that *consult* these rules.

The pairing that causes the most confusion: `project-governance` is the standing contract
saying every repo carries four artifacts and what keeps each true; `/st-init` is the command
that actually creates them, and it reads the skill to know how. **There is no
`/st-governance`.**

- **`project-governance`** — the four-document contract, with `CLAUDE.md` created first from a
  requirements interview. Detects the stack from lockfiles and configs rather than asking;
  interviews only for genuine preferences. Records every pattern that must stay consistent —
  appearance in `DESIGN.md`, code in `CODINGSTYLE.md` — the second time it is used.
- **`branch-workflow`** — decides whether work needs its own branch, **before the first edit**.
  Big tasks branch automatically and say so; minor single-file fixes ask once and honor the
  answer without re-raising it at commit time.
- **`adr-workflow`** — decides what needs an ADR, and stops *before* implementation to get it
  confirmed. Includes a detailed trigger/non-trigger table.
- **`session-log`** — `LOG.md` as a handoff document, with compaction rules that keep it from
  becoming a wall nobody reads.
- **`verification-gate`** — derives the real command vocabulary (CI first, then manifest
  scripts, then the monorepo orchestrator) and refuses to call unverified work done.
- **`commit-workflow`** — atomic commits (one logical change each) with Conventional Commit
  messages, plus GitHub PR / GitLab MR detection from the
  git remote.
- **`design-tokens`** — `DESIGN.md` upkeep and Figma→Tailwind conversion, with a strict
  preference order that keeps hardcoded values out.
- **`engineering-standards`** — no hardcoded values, structure that absorbs the next case,
  correct algorithm over brute force, no decorative emojis. Applied to every implementation without being asked.
- **`repo-hygiene`** — scratch scripts go to the scratchpad, not the repo root.

## Hooks

| Event | Type | Behavior |
| --- | --- | --- |
| `SessionStart` | command | Prints which artifacts exist and the newest `LOG.md` entry. Silent outside a git repo. |
| `PreToolUse` (Bash) | command | Dependency add/remove commands stop for ADR confirmation. Restore commands (`npm install`, `pip install -r`) pass through. |
| `PreToolUse` (Write/Edit) | command | The first edit made while on the default branch prompts for a branch decision. Fires once per session, and is silent on a feature branch, outside a git repo, or on a detached HEAD. |
| `Stop` | prompt | Blocks only when verification was skipped, a dependency/schema/breaking change has no ADR, or durable context is missing from `LOG.md`. Approves by default. |

Both prompting hooks are deliberately restrained — the branch guard fires at most once per
session, and the Stop hook approves unless something concrete is missing. A false block costs
a turn; a false approve costs almost nothing.

## Design notes

**Stack-agnostic by detection, not by vagueness.** The plugin carries a signal table
(lockfiles, manifests, CI files, framework fingerprints) and derives the concrete commands
for whatever it finds — then writes them into `CODINGSTYLE.md` so they are derived once.

**Detect facts, ask preferences.** Asking which package manager a repo uses, when
`pnpm-lock.yaml` is in the root, destroys trust in the tool. Asking whether existing
conventions are the intended standard or legacy to migrate away from is the single most
valuable question in an existing repo, and no file can answer it.

**Placeholders are worse than gaps.** An unfilled `<!-- TODO -->` in a committed file reads
as a decision that was made. `/st-init` fills or deletes every one.

## Adapting it

The templates in `templates/` are the parts most worth editing for your own taste — they are
what lands in every repo. The skills are prose; edit them the way you would edit
documentation, and reload with `/plugin`.
