---
description: Verify, then make atomic commits with Conventional Commit messages
argument-hint: [--push] [--pr] [message hint]
---

Commit the current work.

Use the `commit-workflow` skill, and the `repo-hygiene` skill for the pre-commit scan.

`$ARGUMENTS` may contain `--push` (push after committing), `--pr` (open a PR/MR after
pushing), and/or a free-text hint about what the change is.

## Steps

1. **Verify.** Run the verification gate first. Do not commit unverified code — if
   verification fails, fix it or stop; do not commit anyway.

2. **Read the diff.** `git status`, then `git diff` and `git diff --staged`. Read it; do not
   commit blind.

3. **Hygiene scan.** Scratch scripts, debug leftovers (`console.log`, `dd()`, `var_dump`,
   `debugger`), commented-out blocks, `.env` files, anything with a credential shape, editor
   artifacts. Raise what you find — do not silently include it and do not silently delete it.

4. **Split into atomic commits.** If the diff holds more than one logical change, propose the
   split — one Conventional Commit subject per group — and commit each group separately, in an
   order where every commit passes verification. Stage only the paths (or hunks) belonging to
   the current commit. If unrelated changes are present, leave them and say what you left out.
   Never bundle unrelated work.

5. **Branch if needed.** If on the default branch and the change is non-trivial, create
   `<type>/<short-kebab-description>` — honoring any existing convention visible in
   `git branch -a`.

6. **Write the message.** Conventional Commits, imperative subject, ≤ 72 chars, specific
   enough that someone scanning `git log` can identify it. `fix: update` is never acceptable.
   Honor `commitlint.config.*` if present. Body only when the *why* is not obvious.

7. **Update `LOG.md`** if the work produced anything durable, and include it in the commit.

8. **Commit.** Never `--no-verify`. If a pre-commit hook fails, fix the cause.

9. **If `--push`:** check for divergence first, then push. Never force-push a shared branch.

10. **If `--pr`:** read the git remote to decide GitHub PR (`gh pr create`) or GitLab MR
    (`glab mr create`, or `git push -o merge_request.create`). Use the host's own vocabulary.
    Body: Summary, Changes, Verification, Notes — and link the ADR if the change implements one.
    If no CLI is available, push and hand back the compare URL.
