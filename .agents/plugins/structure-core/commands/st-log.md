---
description: Append this session's work to LOG.md and compact if needed
---

Update `LOG.md` with the durable outcome of this session.

Use the `session-log` skill.

## Steps

1. **Decide whether there is anything to record.** If the session produced nothing durable —
   a question answered, files read, an exploration that changed nothing — say so and stop.
   An empty-calorie entry costs the next session real attention.

2. **Write the entry** at the top, directly under the header. Newest first, never appended
   to the bottom.

   `## YYYY-MM-DD — <subject>` using today's actual date, then **Did / Why / Watch out /
   Open / Next**, omitting any line with no content. Fifteen lines maximum.

   Record only what the code cannot say for itself: reasoning, rejected approaches, gotchas,
   where work stopped. Not a file-by-file diff — git already has that.

   Multiple unrelated pieces of work get separate entries.

3. **Cross-reference rather than duplicate.** If a decision is in an ADR, write
   `See ADR-NNNN.` If something is a durable rule, promote it into `CODINGSTYLE.md` or
   `DESIGN.md` and do not repeat it here.

4. **Compact if due** — more than 10 verbatim entries, or the file is over ~400 lines.
   Collapse older entries to one line each under `## Consolidated history`, grouped by month.
   Delete entries whose value has expired: resolved **Open:** items, completed **Next:**
   steps. Before dropping anything, promote any durable rule it contains into the right file.

5. **Report** what you added in one line, and say whether compaction ran.
