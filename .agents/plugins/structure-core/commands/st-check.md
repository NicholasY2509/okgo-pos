---
description: Run the repository's format, lint, typecheck, and test commands
argument-hint: [--full] [paths]
---

Run the verification gate on this repository.

Use the `verification-gate` skill.

Scope: `$ARGUMENTS` if paths are given, otherwise the files changed in the working tree
(`git status --porcelain` and `git diff --name-only`). `--full` means run the complete suite
rather than a scoped subset.

## Steps

1. **Get the command table** from `CODINGSTYLE.md`. If it is absent or stale, derive it —
   CI workflows first, then manifest scripts, then the monorepo orchestrator — and write the
   corrected table back to `CODINGSTYLE.md` so it is not re-derived next time.

2. **Run in order, stopping at the first failure:** format (write mode) → lint (with autofix,
   then re-run) → typecheck → test (scoped) → build (only if the change could plausibly break
   it: config, imports, dependencies, bundler behavior).

3. **Fix what you broke.** A failure in code from this session gets fixed, not reported back.
   Verify a suspected pre-existing failure against the base commit before calling it that.

4. **Never** disable a rule, skip a test, add an ignore comment, or loosen a type to get to
   green. A rule that genuinely needs to change is an ADR.

5. **Report** the commands that actually ran and their results, with real output for failures.
   Do not claim a command ran if it did not, and do not describe a failing run as mostly
   passing.

If the repo has no tooling at all, say so plainly and fall back to reading the changed code
against `CODINGSTYLE.md`.
