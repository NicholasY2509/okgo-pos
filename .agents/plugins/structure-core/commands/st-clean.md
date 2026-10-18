---
description: Find one-off scripts and debug leftovers, then clean with approval
argument-hint: [--staged]
---

Find repository clutter and clean it up with the user's approval.

Use the `repo-hygiene` skill.

Scope: the whole repo by default; only staged changes if `$ARGUMENTS` contains `--staged`.

## Steps

1. **Inventory — do not delete anything yet.** Look for:
   - Scratch-name patterns: `patch_*`, `fix_*`, `update_*`, `reset_*`, `temp_*`, `*_v2`,
     `*_old`, `*_backup`, `*.bak`, `*.orig`
   - Bare output dumps at the root: `output.txt`, `current_*.txt`, `debug.log`
   - Numbered siblings of a real file
   - Root-level files that are not part of the framework's expected root layout
   - Debug leftovers inside tracked source: `console.log`, `dd()`, `var_dump`, `print()`,
     `debugger`, `binding.pry`, commented-out blocks
   - Committed `.env` files, credential-shaped strings, editor and OS artifacts

2. **Check references before proposing any deletion.** Grep the filename across the repo
   including CI configs, Dockerfiles, deploy scripts, and manifest `scripts`. A file nothing
   imports may still be invoked by a pipeline.

3. **Present the inventory grouped by confidence** — clearly scratch, probably scratch,
   unclear — each with what it appears to do, when it was last touched
   (`git log -1 --format=%ad -- <file>`), and whether anything references it.

4. **Get explicit approval before deleting.** Deleting committed files is always the user's
   call. Never delete anything under a test directory, migrations, seeders, or config,
   regardless of how temporary the name looks — migrations especially look disposable and
   are not.

5. **Delete with `git rm`** in a single `chore: remove one-off scripts` commit, separate from
   any feature work.

6. **Extend `.gitignore`** for recurring categories, with a comment saying why, so the same
   clutter cannot return.

Do not reorganize the repository. Moving source files, renaming modules, or restructuring
directories is not hygiene — it is an ADR.
