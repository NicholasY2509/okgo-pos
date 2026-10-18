---
name: repo-hygiene
description: Keep repositories free of one-off debug scripts, patch files, and scratch output. Use before committing, whenever creating a temporary or throwaway script, when a file is needed only to inspect or fix data once, or when the user says clean up, remove debug files, tidy the repo, or /st-clean.
---

# Repo Hygiene

A repository accumulates one-off files the way a desk accumulates paper. Each one seemed necessary for ten minutes and then became permanent, and a year later nobody can tell which are load-bearing.

## The rule for temporary work

**Throwaway scripts go in the scratchpad, not the repo.**

When writing something to inspect state, patch data once, reproduce a bug, or explore an API, write it to the session scratchpad directory. Do not create it at the repo root "just for a second" — that is exactly how it becomes permanent.

Something belongs in the repo only if it will be run again, by someone else, deliberately. If it will, then it is a real artifact: give it a home (`scripts/`, `tools/`, a framework command), a name that says what it does, and a comment saying when to run it.

## Recognizing scratch files

These names and shapes are almost always scratch:

- `patch_*.py`, `fix_*.php`, `update_*.js`, `reset_*.sql`, `temp_*`, `test_*.php` outside a test directory
- `*_new`, `*_old`, `*_v2`, `*_backup`, `*.bak`, `*.orig`, `*.copy`
- Bare output dumps at the root: `output.txt`, `current_*.txt`, `debug.log`, `result.json`
- Numbered siblings of a real file — `update_dashboard.php` next to `update_dashboard2.php`
- Anything at the repo root that does not match the framework's expected root layout

The last one is the sharpest test. Every framework has a known root shape. A file that is not part of it, and is not config, deserves a question.

## Before committing

Scan `git status` and the staged diff for:

- Scratch files by the patterns above
- Debug leftovers in real files — `console.log`, `dd()`, `var_dump`, `print()`, `debugger`, `binding.pry`, commented-out blocks left "just in case"
- `.env` or anything with a credential shape
- Editor and OS artifacts — `.DS_Store`, `Thumbs.db`, `*.swp`, IDE directories
- Build output and dependency directories that should be ignored
- Large binaries added without discussion

Raise anything found; do not silently commit it and do not silently delete it.

## Cleaning what is already committed

When asked to clean up an existing repo:

1. **Inventory first, delete second.** List the candidates with what each appears to do and when it was last touched (`git log -1 --format=%ad -- <file>`).
2. **Check whether anything references it** — grep for the filename across the repo, including CI configs, Dockerfiles, `composer.json`/`package.json` scripts, and deploy scripts. A file nobody imports may still be invoked by a pipeline.
3. **Present the list and get confirmation before deleting.** Deleting committed files is the user's call, always. Group them: clearly-scratch, probably-scratch, and unclear.
4. **Delete with `git rm`** so the removal is tracked, in a single `chore: remove one-off scripts` commit separate from any feature work.
5. **Extend `.gitignore`** so the same category cannot come back.

Never delete: anything under a test directory, migrations, seeders, config, or anything referenced by CI — regardless of how temporary its name looks. Migrations especially look disposable and are not.

## .gitignore maintenance

When a scratch category recurs, ignore the pattern rather than deleting instances repeatedly. Add entries with a comment saying why:

```gitignore
# One-off data patch scripts — write these to the scratchpad instead
patch_*.py
fix_*.php
reset_*.php
```

## What this is not

Not a mandate to reorganize a working repo. Do not move source files, rename modules, or restructure directories under the banner of hygiene. This skill is about removing what should never have been committed — nothing more. Structural change is an ADR.
