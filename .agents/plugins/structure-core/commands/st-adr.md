---
description: Draft an Architecture Decision Record and get it confirmed
argument-hint: [decision subject]
---

Draft an ADR for: **$ARGUMENTS**

Use the `adr-workflow` skill.

If `$ARGUMENTS` is empty, identify the decision from the current conversation. If there is no
pending decision, say so and stop rather than manufacturing one.

## Steps

1. **Read `docs/adr/README.md`** for the next number and to check whether an existing ADR
   already covers or contradicts this. If one does, this is a supersede, not a new decision —
   handle it as such.

2. **Gather real context.** Read the code the decision affects. An ADR written without reading
   the affected code produces generic reasoning that helps nobody. Establish the actual
   constraints: current versions, existing patterns, what cannot move.

3. **Identify genuine alternatives** — at least two, with the specific reason each loses. If
   there is truly only one option, this may not be an ADR; say so.

4. **Draft** from `${CLAUDE_PLUGIN_ROOT}/templates/adr/0000-template.md`. Fill every section.
   The **Consequences → Harder** section is mandatory and must be substantive.

5. **Present it before writing the file.** Show the draft and get explicit confirmation. When
   there is a real choice between options, use `AskUserQuestion` with each option's tradeoff
   as its description. When you are confirming a single recommendation, ask plainly.

6. **On confirmation:** write `docs/adr/NNNN-kebab-title.md` with status `Accepted`, add the
   row to the index, and note it in `LOG.md`. If the user chose against your recommendation,
   record their choice as accepted and put your reservation under Notes.

7. **Only then implement.** The gate exists to catch the decision while it is still cheap to
   change — do not start the work before confirmation.

If the user declines the ADR entirely, honor it, implement, and record one line in `LOG.md`
noting the decision was made without a record.
