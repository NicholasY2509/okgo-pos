---
name: session-log
description: Maintain LOG.md, the compacted running history of work in a repository — a handoff document written for the next agent session. Read it before starting a task to recover prior context; append to it after completing one. Use when the user says update the log, what happened last time, catch up, where were we, session summary, or /st-log.
---

# Session Log

`LOG.md` exists because context does not survive between sessions and git history does not explain itself. It is a **handoff document written for the next agent**, not a changelog for humans and not a diary.

## What belongs in it

Record only what cannot be recovered by reading the code:

- **Why** a change was made the way it was, when the code does not make it obvious
- **What was tried and rejected**, so the next session does not retry it
- **Gotchas discovered** — the config that must be regenerated, the test that is flaky, the service that must be running, the command that silently no-ops
- **Where work stopped mid-stream** and what the next step was
- **Open threads** — things known to be broken, deferred, or waiting on the user
- **Corrections to the other governance docs** that were noticed but not yet applied

## What does not belong

- A file-by-file diff summary. Git already has that, and it goes stale instantly.
- Anything already captured in an ADR. Link to the ADR instead: `See ADR-0007.`
- Anything that belongs in `CODINGSTYLE.md` or `DESIGN.md`. If it is a durable rule, put it in the durable file and do not duplicate it here.
- Praise, filler, or restatements of the task prompt.

The bar for a line in `LOG.md`: **would the next session make a worse decision without it?** If no, cut it.

## Entry format

Newest first, directly beneath the header. Never append to the bottom.

```markdown
## 2026-09-08 — Sales funnel percentage pills

**Did:** Capped trend pill width at 60.5px in `SalesDashboard.vue` to match the Figma frame.

**Why:** The pills wrapped at 2 digits on narrow viewports. Fixed width was chosen over `min-w` because the design requires exact alignment across the funnel rows.

**Watch out:** `resources/js/wayfinder/` is generated — do not hand-edit; run `php artisan wayfinder:generate` after route changes.

**Open:** The pill color for negative trends is still hardcoded; should move into DESIGN.md tokens.

**Next:** Apply the same width cap to the ranking table pills.
```

Rules for entries:

- Heading is `## YYYY-MM-DD — <short subject>`. Use the actual date, never a relative one.
- **Did / Why / Watch out / Open / Next** — omit any line that has no content. An entry is often just Did + Why.
- Fifteen lines maximum. If the work genuinely needs more, it needed an ADR.
- Reference files as paths, and functions by name, so they are searchable.
- Multiple unrelated tasks in one session get separate entries, not one merged entry.

## Compaction

This is the part that makes `LOG.md` useful over years rather than a wall that gets ignored.

**Keep the 10 most recent entries verbatim.** Below them, a `## Consolidated history` section holds one line per older entry, grouped by month:

```markdown
## Consolidated history

### 2026-08
- Migrated notification delivery to FCM; token refresh handled in `FCMTokenController`. (ADR-0004)
- Sales dashboard rebuilt against the new target period model — old `MonthlyTarget` reads removed.
- Service worker build moved into `npm run build`; standalone `build:sw` kept for debugging only.
```

Compact when either threshold trips:

- More than 10 verbatim entries, or
- The file exceeds ~400 lines

When compacting, an entry collapses to one line that preserves only its durable value — the gotcha or the reason. Entries whose value has fully expired (a resolved open thread, a next-step that was completed) are **deleted**, not compressed. Deleting expired lines is the whole point; a consolidated history that only grows is just a slower wall.

Anything discovered during compaction that turns out to be a durable rule gets promoted into `CODINGSTYLE.md` or `DESIGN.md` before the line is dropped.

## When to write

Append after completing a unit of work, before or alongside the commit. Not after every tool call.

Skip the entry entirely when the session produced nothing durable — a question answered, a file read, an exploration that changed nothing. An empty-calorie entry costs the next session real attention.

## When to read

Read `LOG.md` at the start of work in a repo, before touching code. Read the verbatim entries in full; skim the consolidated history for anything matching your current task's subject.

If the top entry has a **Next:** line and the user's request is unrelated, mention the dangling thread once and continue with what they asked. Do not hijack their request to finish old work.
