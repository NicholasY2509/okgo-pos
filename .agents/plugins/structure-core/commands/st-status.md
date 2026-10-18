---
description: Report Structure governance health for this repository
allowed-tools: Read, Glob, Grep, Bash
---

Report the governance health of this repository. Read-only — change nothing.

Check and report, compactly:

1. **Artifacts present**
   `CLAUDE.md`, `CODINGSTYLE.md`, `DESIGN.md`, `LOG.md`, `docs/adr/` — present or missing.
   For `CLAUDE.md`, also flag a missing Requirements or Repository section.
   For each present file, flag any remaining `<!-- TODO -->` placeholders, since those read as
   decisions that were never made.

2. **CODINGSTYLE.md freshness**
   Compare its stack table against the current manifests. Report dependencies that are in the
   manifest but not the table, and vice versa. Report any command in the table that no longer
   exists as a script.

3. **DESIGN.md drift**
   Sample the UI code for hardcoded colors, font sizes, and spacing that contradict or bypass
   the tokens. Report the count and the three worst offenders — do not list every instance.

4. **LOG.md state**
   Date of the newest entry, number of verbatim entries, total line count. Flag if compaction
   is due (more than 10 entries, or over ~400 lines). Report any unresolved **Open:** or
   dangling **Next:** lines.

5. **ADR state**
   Count by status. Flag any ADR missing from the index, any index row without a file, and any
   `Proposed` record older than a month that was never accepted or rejected.

6. **Hygiene**
   Scratch-file candidates at the repo root, debug leftovers in tracked source, and anything
   with a credential shape. Report; do not delete.

Finish with a single prioritized line of what to do next — or "healthy" if there is nothing.
Keep the whole report under 30 lines.
