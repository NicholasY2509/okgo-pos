---
name: branch-workflow
description: Decide whether work needs its own git branch, and create it BEFORE the first edit. Use at the start of any task that will change files — a feature, a refactor, a bug fix, a dependency or schema change — and whenever the current branch is the default branch (main/master). Big tasks branch automatically; minor ones ask the user whether to branch or work in place.
---

# Branch Workflow

The decision to branch is worth nothing at commit time. By then the work is already sitting on
`main`, and moving it costs a stash-and-replay you did not sign up for. **This skill runs
before the first edit, not before the commit.**

## The check

At the start of any task that will modify files, answer three questions in order:

1. **Am I already on a non-default branch?** → Do nothing. Work continues where it is.
   Do not stack a second branch on top of a feature branch unless the user asks.
2. **Is this task big or minor?** → See the classification below.
3. **Did the user say where to work?** → Their instruction wins over everything here.

Find the default branch rather than assuming `main`:

```bash
git symbolic-ref --quiet refs/remotes/origin/HEAD 2>/dev/null | sed 's|.*/||'
# fall back to: git branch -l main master --format='%(refname:short)' | head -1
```

## Big task — branch, announce, proceed

Create the branch without asking. Say what you did in one line and keep going; do not turn it
into a question.

> Branched to `feat/sales-funnel-pills` before starting.

A task is **big** when any of these hold:

- It adds or changes a feature, rather than correcting existing behavior
- It touches more than about three files
- It will take more than one commit to tell a coherent story
- It is a refactor spanning multiple modules
- It changes a dependency, a schema, or architecture — these are ADR-gated too
- It is exploratory and might be abandoned
- It will take long enough that the user may want to ship something else meanwhile

The last two are the ones people forget. A branch is cheap insurance against work you might
throw away, and against blocking an urgent fix behind a half-finished experiment.

## Minor task — ask, then honor the answer

Ask once, with a real recommendation, and move on:

> This is a one-line fix in `SalesDashboard.vue`. Branch it, or commit straight to `main`?

Use `AskUserQuestion` when it is genuinely a toss-up; a plain question inline is fine when you
have a clear recommendation. **Ask exactly once per task.** If the user says work in place, do
not re-raise it at commit time — that is nagging, and it is the fastest way to make this skill
something they turn off.

A task is **minor** when it is a single-file change that corrects something: a typo, a copy
change, a styling tweak, a config value, a comment, or a test added to an existing suite.

## Naming

```
<type>/<short-kebab-description>
```

Types match the Conventional Commit vocabulary: `feat` `fix` `refactor` `perf` `style` `test`
`docs` `build` `ci` `chore`.

`feat/sales-funnel-pills` · `fix/n-plus-one-ranking` · `refactor/target-period-model`

**Check `git branch -a` first.** An existing convention in the repo's history beats this
default — if the team uses `GF-123-description` or `feature/...`, follow that instead. Read
the last ten branches before inventing a scheme.

If the work has a ticket, include its ID in the position the repo's convention puts it.

## Creating it

```bash
git switch -c <branch-name>
```

Uncommitted changes come with you, which is normally what you want when you realize mid-task
that you should have branched. If the working tree holds unrelated changes that should *not*
travel, say so and let the user decide before switching.

Never create a branch from a dirty tree you have not looked at. `git status` first.

## Mid-task realization

Noticing on the fifth edit that you are still on `main` is common and recoverable. Do not
silently continue, and do not panic-stash. Say it plainly and switch:

> Still on `main` — moving this work to `fix/token-refresh` now.

`git switch -c` carries the uncommitted work over. Nothing is lost.

## What this skill does not do

It does not commit, push, or open a PR — that is `commit-workflow`. It does not decide whether
the change needs an ADR — that is `adr-workflow`, and it runs alongside this, not instead of
it. A dependency change gets both: a branch, and an ADR before the install runs.

It also does not apply outside a git repository, or when the repo has no default branch
checked out (a detached HEAD, a fresh repo with no commits). Skip silently in those cases.
