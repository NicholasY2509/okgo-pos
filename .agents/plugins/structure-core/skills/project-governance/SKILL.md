---
name: project-governance
description: Enforce the Structure four-document contract in a repository — CODINGSTYLE.md, DESIGN.md, LOG.md, and docs/adr/ — with CLAUDE.md created first from a requirements interview, and keep recurring design and code patterns recorded in those documents. Use at the start of work in any repo, when CLAUDE.md or any of those files is missing, or when the user says init project docs, set up conventions, bootstrap governance, project standards, or /st-init. Detects the tech stack from the existing code instead of asking when the repo already has code, and interviews the user when it does not.
---

# Project Governance

Every repository that uses Structure carries four artifacts. They are the durable memory of the project — the part a fresh agent session cannot reconstruct from the code alone.

| Artifact | Answers | Written by |
|---|---|---|
| `CODINGSTYLE.md` | What stack is this, and how do we write code here? | User-defined, stack-detected |
| `DESIGN.md` | What are the typography, color, and spacing rules? | User-defined, Figma-derived |
| `LOG.md` | What happened recently, and where was I? | Appended each session |
| `docs/adr/` | Why is it built this way? | One file per decision |

## Before doing anything else in a repo

Read what exists, in this order:

1. `CODINGSTYLE.md` — governs every line you write.
2. `DESIGN.md` — governs every style you touch. Skip if the repo has no UI.
3. `LOG.md` — recover where the last session stopped.
4. `docs/adr/` — read the index; read individual ADRs only when your task touches their subject.

Then check for gaps. Report missing artifacts once, in one line, and offer to create them:

> `DESIGN.md` and `docs/adr/` are missing. Run `/st-init` to set them up.

Do not silently proceed without `CODINGSTYLE.md`. If it is absent and the user asks for implementation work, say so and offer `/st-init` first. If they decline, infer conventions from sibling files and note in your reply that conventions were inferred, not governed.

Finally, before the first edit: if the task will change files and you are on the default
branch, hand off to the `branch-workflow` skill. A branch decided after the work exists is a
branch decided too late.

## Creating the artifacts

The rule that decides whether to ask or to read:

**If the repository already contains code, read the stack from the code. Never interview the user about facts the lockfiles already state.**
**If the repository is empty or greenfield, interview the user.**

This split applies per-section, not per-file. In an existing repo you still ask about *preferences* (naming style, error-handling philosophy, test expectations) while *detecting* facts (language versions, frameworks, package manager, existing scripts).

- Detection procedure and the full signal table: `references/stack-detection.md`
- The interview questions, and which are mandatory: `references/bootstrap-interview.md`

Templates live in `${CLAUDE_PLUGIN_ROOT}/templates/`. Copy them, then fill every `<!-- TODO -->` marker. Never leave a template placeholder in a committed file — an unfilled placeholder is worse than an absent section, because it reads as a decision that was made.

### Mandatory questions

`CODINGSTYLE.md` and `DESIGN.md` encode user preference, not defaults. When a repo has neither, you **must** ask before writing them. Use `AskUserQuestion` with concrete options drawn from what you detected, not open-ended prompts. Ask in one batch, not serially.

For `DESIGN.md` specifically: if the user has a Figma file, ask them to paste the CSS for a representative screen or component rather than answering token questions abstractly. The `design-tokens` skill converts that into the token table.

## Keeping the artifacts true

An artifact that has drifted from the code is a liability — it will confidently mislead the next session.

### Consistency lives in the documents

Anything that must look or work the same way every time is written down in its document, not
carried in a session's memory. Each kind of rule has one home:

| Kind of consistency | Home | Examples |
|---|---|---|
| How things look | `DESIGN.md` | Tokens, component conventions (button sizes, card anatomy, empty and loading states), layout patterns, icon usage |
| How code is written | `CODINGSTYLE.md` | Naming, file layout, error handling, data-fetching pattern, API response shape, test structure |
| Why a pattern was chosen | `docs/adr/` | A pattern that replaced an alternative, or that is costly to reverse |

- **Before building**, look up the relevant rule and follow it. A second card that differs
  from the first, or a second endpoint shaped differently from the first, is a defect even if
  each looks fine on its own.
- **When a pattern repeats** — the second time a component appearance or a code shape is used
  — record it in its home in the same change. The third use then follows a written rule, not a
  guess at the first two.
- **When you establish something new** that later work should match, add it in the same change
  and say so in one line. Do not wait for it to repeat if you already know it is the standard.
- **When the code and the document disagree**, the document wins for new code. Report the
  disagreement; fix it only inside the code you are already touching.

Keep entries short and concrete — one rule per row, with the token or file it applies to. A
document full of prose nobody reads keeps nothing consistent.

### Change triggers

- **After adding a dependency**, update the stack table in `CODINGSTYLE.md`. The ADR records *why*; `CODINGSTYLE.md` records *that it is now part of the stack*.
- **After changing a token** (a color, a spacing scale, a font), update `DESIGN.md` in the same change. A hardcoded hex that contradicts `DESIGN.md` is a bug.
- **After finishing a task**, append to `LOG.md` — see the `session-log` skill.
- **After an accepted architectural decision**, add the ADR — see the `adr-workflow` skill.

When you notice drift you did not cause, say so. Do not fix it silently inside an unrelated change.

## File locations

Default paths, relative to repo root:

```
CODINGSTYLE.md
DESIGN.md
LOG.md
docs/adr/README.md          # index
docs/adr/0000-template.md
docs/adr/0001-<slug>.md
```

If the repo already has an established docs location (`docs/`, `documentation/`, a monorepo `docs` package), place `docs/adr/` there and note the location in `CODINGSTYLE.md`. Do not create a competing second docs tree.

In a monorepo, `CODINGSTYLE.md`, `LOG.md`, and `docs/adr/` live at the workspace root. `DESIGN.md` lives at the root when one design system spans all apps, and per-app when they genuinely differ. Ask which, once.

## Relationship to CLAUDE.md

`CLAUDE.md` is Claude Code's entry point, and it is **always created first**. Before any of the four artifacts exist, `/st-init` writes `CLAUDE.md` from a requirements interview: what the project is, who it is for, what it must do, what is out of scope, its constraints, and the repo details (host, default branch, branch naming, deploy target). The questions are in `references/bootstrap-interview.md`. Template: `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md`.

The requirements interview is never skipped for being an existing repo — code says how a project is built, not what it is for. Only the repo details are detected rather than asked.

`CLAUDE.md` holds the *what* and *why* of the project; the four artifacts hold the *how*. Do not duplicate content between them. Once the artifacts exist, `CLAUDE.md` should point:

```markdown
## Project standards
- Coding conventions and tech stack: @CODINGSTYLE.md
- Design tokens and styling rules: @DESIGN.md
- Recent work and session context: @LOG.md
- Architecture decisions: docs/adr/
```

If `CLAUDE.md` already contains conventions inline, migrate them into `CODINGSTYLE.md` and replace them with the pointer. Confirm with the user before deleting content from an existing `CLAUDE.md`.
