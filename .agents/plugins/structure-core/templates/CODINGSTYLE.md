# Coding Style

The conventions for this repository. This file governs every change made here.
Facts in the stack table are detected from the code; everything else is a deliberate choice.

> Maintained under Structure. Update the stack table when a dependency changes; update the
> command table when a command changes. Record a code pattern here the second time it is used.
> A stale entry here misleads every future session.

## Tech Stack

<!-- TODO: detect from manifests and lockfiles. Include versions where a major boundary matters. -->

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Language | | | |
| Runtime | | | |
| Framework | | | |
| Package manager | | | Authoritative — from the lockfile |
| Frontend | | | |
| Styling | | | |
| Database | | | |
| ORM / query layer | | | |
| Testing | | | |
| Build tool | | | |

### Key libraries

<!-- TODO: libraries a contributor must know about to work here, one line each on what it's for. -->

| Library | Used for |
| --- | --- |
| | |

## Commands

<!-- TODO: derive from CI workflows first, then manifest scripts. Verify each one runs. -->

| Purpose | Command |
| --- | --- |
| Install | |
| Dev server | |
| Format | |
| Lint | |
| Typecheck | |
| Test (single) | |
| Test (all) | |
| Build | |

## Conventions

### Naming

<!-- TODO: files, directories, components, functions, variables, constants, database columns. -->

### Directory layout

<!-- TODO: what goes where, and what must not be created without approval. -->

### Types

<!-- TODO: strictness, where types live, whether `any` is ever acceptable, inference vs annotation. -->

### Error handling

<!-- TODO: how errors are raised, caught, surfaced to the user, and logged.
     State explicitly whether silent catches are acceptable — they usually are not. -->

### Comments

<!-- TODO: docblock expectations, and when an inline comment is warranted. -->

### Testing

<!-- TODO: is a test required for every change? What kind — unit, feature, e2e?
     Where do tests live? What is the naming pattern? -->

## Non-negotiables

These apply regardless of what surrounding code does:

- No hardcoded values — colors, spacing, URLs, magic numbers, and status strings are tokens, config, or enums.
- Structure absorbs the next case without a rewrite. A conditional chain past four branches becomes a map.
- Correct algorithm over brute force. No N+1 queries, no nested scans over the same collection.
- No decorative emojis in code, comments, logs, commit messages, or docs. User-facing emojis only where `DESIGN.md` specifies them.
- Commits are atomic — one logical change each — and follow Conventional Commits.
- A pattern used twice is recorded here (code) or in `DESIGN.md` (appearance), so the third use follows it.
- Verification passes before work is reported as done.
- Risky or architectural changes get an ADR and user confirmation first.

## Off-limits

<!-- TODO: generated directories, vendored code, legacy modules not to touch.
     Delete this section if there are none. -->

| Path | Why |
| --- | --- |
| | |

## Migrating away from

<!-- TODO: patterns present in the codebase that are legacy and must NOT be replicated in new code.
     Delete this section if there are none — but do not leave it blank. -->

| Pattern | Replace with |
| --- | --- |
| | |
