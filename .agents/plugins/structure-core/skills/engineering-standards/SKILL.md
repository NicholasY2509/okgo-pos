---
name: engineering-standards
description: Non-negotiable implementation rules for Structure projects — no hardcoded values, scalable structure, a correct algorithm rather than brute force, and no decorative emojis. Apply when writing or reviewing any implementation, comment, log message, or script output, when a literal appears inline, when a conditional chain is growing, when a loop nests inside another loop over the same data, or when a solution works but would not survive ten times the data.
---

# Engineering Standards

These apply to every line written under Structure, without being asked for. They are not style preferences; they are the conditions under which work is considered done.

## 1. No hardcoded values

A hardcoded value is any literal that a reader would have to guess the meaning of, or that appears in more than one place.

**Never inline:**

- Colors, spacing, font sizes, radii, breakpoints — these come from `DESIGN.md` tokens or the framework's scale. A raw `#3B82F6` or `margin: 13px` in a repo that has `DESIGN.md` is a defect.
- URLs, endpoints, hostnames, ports, bucket names, API keys — configuration or environment.
- Magic numbers — page sizes, timeouts, retry counts, limits, thresholds, tax rates. Name them.
- User-facing strings in a project that has i18n set up.
- Role names, status values, type discriminators — these are enums.
- Paths built by string concatenation where the framework provides a route or path helper.

**Legitimate literals:** mathematical identities (`0`, `1`, `2` for a midpoint), array indices, values used exactly once whose meaning is fully carried by an adjacent well-named variable, and test fixtures — tests should be explicit, not indirected.

The test is not "is this a number" but **"if this value changes, how many places must change, and would someone find them all?"**

## 2. Scalable structure

Write the shape that absorbs the second and third case without being rewritten.

- **Three is a pattern.** The third occurrence of near-identical code is extracted. The second is a judgement call. The first is fine as-is — do not abstract prematurely.
- **A growing conditional chain is a data structure.** When an `if/else if` or `switch` on the same discriminant reaches four branches, or when adding a case means editing multiple sites, replace it with a map, a registry, or polymorphism.
- **Additive over invasive.** Prefer designs where adding a case means adding an entry, not editing a function.
- **No layer-skipping.** If the project has layers (controller → service → repository, or page → hook → client), respect them. A query in a component is a shortcut that costs later.
- **Config over branching.** Behavior that varies by environment, tenant, or feature belongs in configuration, not in `if (env === 'production')` scattered through the code.
- **Name for the domain, not the mechanism.** `pendingApprovals`, not `filteredArray2`.

Scalable does not mean generic. Do not build a plugin system for two cases. The goal is code whose *cost of change stays flat*, which is usually simpler than the clever generic version.

## 3. Algorithm over brute force

Before writing a loop over data that could grow, state the complexity to yourself. If it is worse than linear in the size of the data, justify it or fix it.

**Fix on sight:**

- A nested loop over the same collection to find matches → build a `Map`/dict keyed by the join field, then a single pass. O(n²) → O(n).
- A query inside a loop (the N+1 problem) → eager-load, batch, or join. This is the single most common real performance defect; check for it in every data-access change.
- Repeated `.find()` or `.filter()` on the same array inside a loop → index it once.
- Sorting inside a loop → sort once outside.
- Recomputing a derived value on every render or iteration when the inputs did not change → hoist, memoize, or compute at the source.
- Loading a full collection to count, sum, or check existence → let the database do it (`COUNT`, `EXISTS`, aggregate).
- Loading a full collection to display a page of it → paginate at the source.

**When brute force is correct:** the input is bounded and provably small (an enum, a fixed config list, a route table), the clear version is fast enough and the fast version is unreadable, or you are writing a deliberately simple reference implementation that a test compares against. In the second case, say so in a comment with the actual bound: `// n <= 12 (months); linear scan is clearer than an index here.`

**Do not micro-optimize.** Complexity class matters; shaving constant factors in code that runs once does not, and it costs readability.

## 4. No unnecessary emojis

Emojis do not belong in anything you write into the repository unless the product calls for
them.

**Never add emojis to:**

- Source code — identifiers, comments, docblocks, log and console output, error messages.
- Scripts and CLI output — `✅ Done!` is `Done.`
- Commit messages, branch names, PR/MR titles and bodies.
- Governance documents and READMEs — headings and bullets carry structure without decoration.

**Legitimate emojis:** user-facing content where the design specifies them (record it in
`DESIGN.md` so it is a decision, not a habit), data the feature genuinely processes, and test
fixtures that exercise Unicode handling.

The test is **"would removing it lose information?"** If not, it is decoration. When the
surrounding code already uses emojis decoratively, follow section 5: keep your own addition
clean and mention the pattern rather than spreading it.

## 5. When these rules conflict with the codebase

If the surrounding code violates these standards, do not silently replicate the violation and do not unilaterally refactor the file.

Match the local structure for consistency, keep your own addition clean, and surface it:

> Followed the existing inline-hex pattern in this file for consistency, but these should move to DESIGN.md tokens — noted in LOG.md.

If the violation is a genuine defect in the path you are touching — an N+1 in the query you are modifying — fix it as part of the change and say that you did. If it is broad, propose it as separate work rather than expanding the current change.

## 6. What "done" means

Before reporting work complete: the verification gate passed, no new hardcoded values were introduced, no new N+1 or nested scan was introduced, no decorative emojis were added, and any deliberate deviation from these standards was stated out loud rather than left for the reader to find.
