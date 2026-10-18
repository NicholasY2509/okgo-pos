---
name: commit-workflow
description: Make atomic commits with Conventional Commit messages, and open pull requests on GitHub or merge requests on GitLab. Use when committing, staging, pushing, or when the user says commit, push, open a PR, create an MR, or /st-commit. Detects the host from the git remote so the right tooling and vocabulary are used. Deciding which branch the work belongs on is the branch-workflow skill's job, and it runs before the first edit rather than here.
---

# Commit Workflow

Two rules hold for every commit, without being asked: **it is atomic**, and **its message is a
Conventional Commit**.

## Atomic commits

One commit is one logical change — the smallest unit that makes sense on its own, could be
reverted on its own, and leaves the project building and passing.

- **Split by intent, not by file.** A bug fix, the refactor that enabled it, and an unrelated
  formatting pass are three commits, even when they touch the same file.
- **Never mix types.** A diff that needs both `feat` and `fix` to describe it is two commits.
  If the subject line wants an "and", split it.
- **Keep each commit green.** Order the commits so every one of them passes verification.
  Do not commit a half-change that a later commit repairs.
- **Do not over-split either.** A feature and the test that proves it belong together; so do a
  rename and every call site it touches.

When the working tree holds several logical changes, propose the split before committing:

> Three commits: `refactor(ranking): extract period resolver`, `fix(ranking): exclude
> archived targets`, `test(ranking): cover archived targets`. Go ahead?

Stage each group by path. When one file holds hunks for two commits, stage a partial patch
(`git diff <file>` into a patch, trim it, `git apply --cached`) rather than bundling them.

## Message format

Conventional Commits, always:

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type** — `feat` `fix` `refactor` `perf` `style` `test` `docs` `build` `ci` `chore` `revert`
- **scope** — optional, the affected area: a module, a package in a monorepo, a feature. Lowercase.
- **subject** — imperative mood, lowercase start, no trailing period, ≤ 72 characters. "add pagination to ranking table", not "Added pagination." or "adds pagination".
- **body** — optional. The *why*, when it is not obvious. Wrap at 72.
- **footer** — `BREAKING CHANGE: <description>`, issue references.

Check for `commitlint.config.*` and honor its ruleset over these defaults — a rejected commit wastes a round trip.

### Type selection

`style` means formatting and visual/CSS changes with no behavior change. `refactor` means restructuring with no behavior change. `perf` means a measurable performance change. If a change adds behavior, it is `feat` even if it is small; if it corrects behavior, it is `fix` even if it is large.

### The bar for a subject line

A subject line must let someone scanning `git log` decide whether this commit is the one they are looking for. `fix: update` fails that test completely and is never acceptable. If you cannot describe the change specifically, the commit is doing too many things — split it.

## Before committing

1. **Run the verification gate.** Do not commit unverified code.
2. **Review the actual diff** — `git diff` for unstaged, `git diff --staged` for staged. Read it; do not commit blind.
3. **Check for accidental inclusions** — debug scripts, `.env` files, credentials, commented-out code, stray `console.log` / `dd()` / `print()`, one-off patch scripts. See the `repo-hygiene` skill.
4. **Check for secrets.** Any string that looks like a key, token, or password stops the commit.
5. **Update `LOG.md`** if the work produced anything durable.

## Staging

Stage deliberately. `git add -A` is acceptable only when you have read the full status and every change belongs in this commit.

When the working tree contains unrelated changes, stage only the paths for this commit and say what you left out. Never bundle unrelated work to save a round trip — see [Atomic commits](#atomic-commits).

## Branching

Branch selection belongs to the `branch-workflow` skill, and it should have run **before the
first edit** — not here. That skill holds the big-vs-minor classification and the naming rules.

By commit time only two cases remain:

- **On a feature branch** — the normal case. Commit there.
- **Still on the default branch** — the branch decision was missed. Do not quietly commit to
  `main`. Say so and move the work:

  > This is still on `main`. Moving it to `fix/n-plus-one-ranking` before committing — say the
  > word if you want it on `main` instead.

  `git switch -c <name>` carries the uncommitted work across; nothing is lost.

The exception is a user who already chose to work in place. If `branch-workflow` asked and they
said `main`, honor it and commit without re-raising. Asking twice is nagging, and nagging is
how a rule gets switched off.

## Committing

Commit only when the user asks. Do not commit as an unrequested side effect of finishing a task.

Never use `--no-verify`. If a pre-commit hook fails, fix the cause. A hook that must be bypassed is an ADR-level conversation, not a flag.

Prefer a new commit over amending, unless the user asks to amend and the commit is unpushed.

## GitHub vs GitLab

Read the remote to decide — `git remote get-url origin`:

| Host | Vocabulary | Tooling |
|---|---|---|
| `github.com` | Pull Request | `gh pr create` |
| `gitlab.com` / self-hosted GitLab | Merge Request | `glab mr create`, or push options |

If neither CLI is installed, push the branch and give the user the compare URL rather than failing.

**GitLab push options** create an MR without any CLI:

```
git push -o merge_request.create \
         -o merge_request.target=main \
         -o merge_request.title="feat: sales funnel percentage pills" \
         origin <branch>
```

## PR / MR body

```markdown
## Summary
One to three sentences: what changed and why.

## Changes
- Bullet per meaningful change, not per file

## Verification
Commands run and their result.

## Notes
Anything a reviewer should look at closely, or that was deliberately left out.
```

Link the ADR when the change implements one: `Implements ADR-0007.`

## Pushing

Push only when asked. Never force-push a shared branch. `--force-with-lease` over `--force` when a force is genuinely needed and the user has asked for it.

Before pushing to a branch that already exists remotely, check whether it has diverged.
