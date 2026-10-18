---
name: verification-gate
description: Detect the repository toolchain and run the correct format, lint, typecheck, build, and test commands before declaring work complete. Use before committing, before opening a PR or MR, and whenever the user says verify, check, run the checks, is it working, is it done, or /st-check. Never report work as finished on an unverified change.
---

# Verification Gate

Work is not done because the edit was applied. It is done when the project's own tooling agrees.

## The rule

**Never report a code change as complete without running verification.** If verification cannot be run — no tooling, a broken environment, a missing dependency — say that explicitly rather than implying success:

> Applied the change. Could not verify: `pnpm lint` fails to start because node_modules is not installed.

Reporting an unverified change as done is the failure mode this skill exists to prevent.

## Which commands to run

The command table in `CODINGSTYLE.md` is authoritative. If it is missing or stale, derive it — see `references/toolchain-commands.md` — and write it back so the next session does not repeat the work.

Priority order for deriving:

1. **CI workflow files** (`.github/workflows/`, `.gitlab-ci.yml`). What CI runs is what must pass. Strongest signal.
2. **Manifest scripts** (`package.json` `scripts`, `composer.json` `scripts`). Use the script name, not the underlying binary.
3. **Monorepo orchestrator** (`nx`, `turbo`). Run through it so project config and caching apply.
4. **Framework defaults**, only as a fallback.

## Order of operations

Run in this order and stop at the first failure — later stages report noise when an earlier one is broken.

1. **Format** — write mode, not check mode. Formatting failures should be fixed, not reported.
2. **Lint** — with the project's autofix flag if it has one, then re-run to surface what remains.
3. **Typecheck** — the step most likely to catch a real defect. Never skip it in a typed project.
4. **Test** — scoped, see below.
5. **Build** — only when the change could plausibly break it: config changes, new imports, dependency changes, anything touching the bundler or the framework's build-time behavior. Not for a routine component edit.

## Scoping tests

Run the smallest set that actually covers the change, then widen only if it fails.

- Prefer a path or filter: `php artisan test --filter=SalesDashboard`, `nx test client --testPathPattern=Dashboard`, `pytest tests/test_orders.py`.
- Widen to the containing suite if the filtered run fails in a way that suggests broader breakage.
- Run the full suite before a release, before a merge to the main branch, or when the user asks.

If a project has tests and the change has no test covering it, say so. Whether a test is *required* is set in `CODINGSTYLE.md`; if it is required, write it before verifying.

## Interpreting results

- **A failure in code you touched** — fix it. Do not report back with the error and stop.
- **A pre-existing failure unrelated to your change** — verify it is pre-existing (`git stash` and re-run, or check the base commit), then report it as pre-existing and continue. Do not fix it inside an unrelated change without asking.
- **A new warning** — treat as a failure if `CODINGSTYLE.md` says lint-as-error; otherwise report it.
- **A flaky test** — re-run once. If it passes, note the flakiness in `LOG.md`. Do not re-run repeatedly until green.

Never disable a rule, skip a test, add an ignore comment, or loosen a type to make verification pass. If a rule genuinely needs to change, that is an ADR.

## Reporting

State what ran and what happened, with the real output for failures:

> `pnpm exec prettier --write` · `pnpm exec eslint --fix` · `vue-tsc --noEmit` · `php artisan test --filter=Dashboard` — all passing.

Do not claim a command ran if it did not. Do not summarize a failing run as "mostly passing".

## When there is no tooling

In a repo with no formatter, linter, or tests, verification is: re-read the changed code against `CODINGSTYLE.md`, confirm imports resolve, and check for the obvious classes of defect. Report honestly that no automated verification exists — and if the project is one the user owns, that absence is worth raising once.
