---
name: adr-workflow
description: Write and gate Architecture Decision Records in docs/adr/. Use BEFORE installing, upgrading, or removing a package; before changing architecture, a data model, or a schema; before introducing a new pattern, service, or external dependency; and before any change that could break existing behavior. Trigger on npm install, pnpm add, composer require, pip install, migration, schema change, refactor, breaking change, new library, or /st-adr.
---

# ADR Workflow

An ADR records a decision that was expensive to make and would be expensive to reverse. Its audience is a future session that finds the code and asks "why on earth is it like this?"

## The gate

**Any change matching a trigger below stops and gets confirmed with the user before implementation begins.** Not after. The point of the gate is to catch the decision while it is still cheap to change.

The sequence is fixed:

1. **Stop.** Do not run the install, do not write the migration, do not start the refactor.
2. **Draft the ADR** — context, the options you considered, your recommendation, and the consequences.
3. **Present it to the user** and get explicit confirmation. Use `AskUserQuestion` when there is a real choice between options; a plain question when you are confirming a single recommendation.
4. **Write the file** with the accepted decision, then implement.

If the user overrides your recommendation, record *their* decision as accepted and note your reservation under Consequences. The ADR is the record of what was decided, not of who was right.

## Triggers

Full list with edge cases: `references/adr-triggers.md`. The core set:

- **Adding, upgrading across a major version, or removing any dependency.** Including dev dependencies. Excluding lockfile-only patch bumps.
- **Data model changes** — a migration, a schema change, a new table or collection, a changed column type, a new index on a hot path.
- **Architectural structure** — a new service, a new layer, a new directory at the top level, splitting or merging modules.
- **Cross-cutting patterns** — how auth works, how errors propagate, how state is managed, how data is fetched, how jobs are queued.
- **Anything that can break existing code** — changing a shared function's signature, altering a public API response, renaming something widely imported, changing a default.
- **External integrations** — a third-party API, a new environment variable that gates behavior, a new infrastructure dependency.

## Non-triggers

Do not write an ADR for routine work. An ADR directory full of noise is one nobody reads.

- Bug fixes that restore intended behavior
- Adding a feature that follows an established pattern
- Styling and copy changes
- Adding tests
- Formatting, renaming a local variable, extracting a private helper
- Reverting an unreleased change made earlier in the same session

When unsure, apply this test: **would a competent engineer joining in six months be confused by this choice, or would they consider it obvious?** Confusion means ADR.

## File format

`docs/adr/NNNN-kebab-case-title.md`, four-digit sequential number, never reused. Template at `${CLAUDE_PLUGIN_ROOT}/templates/adr/0000-template.md`.

Required sections:

- **Status** — `Proposed` | `Accepted` | `Superseded by ADR-NNNN` | `Deprecated`. Never delete a superseded ADR; mark it and link forward.
- **Context** — the forces at play. What made this a decision rather than an obvious step. Include real constraints: versions, deadlines, existing code that could not move.
- **Decision** — stated in the active voice, present tense: "We use X." One paragraph.
- **Consequences** — what this makes easier, what it makes harder, and what it forecloses. The "harder" half is the part that earns its keep; an ADR with only upsides was not a real decision.
- **Alternatives considered** — each with the reason it lost. "Not considered" is a valid entry only if genuinely true.

Keep the whole file under roughly 80 lines. Density beats completeness — a long ADR does not get read, which defeats the purpose.

## Updating the index

`docs/adr/README.md` holds a one-line-per-ADR table: number, title, status, date. Update it in the same change as the ADR. A stale index makes the whole directory untrustworthy.

## Superseding

When a new decision replaces an old one:

1. Set the old ADR's status to `Superseded by ADR-NNNN`. Change nothing else in it — it is a historical record, not a living document.
2. The new ADR's Context opens by referencing what it replaces and what changed to make the old decision wrong.

## Reading ADRs

Read the index at the start of work in a repo. Read a full ADR only when your task touches its subject — before modifying auth, read the auth ADR. If your task contradicts an accepted ADR, that is itself a trigger: stop and raise it rather than quietly diverging.
