# ADR Triggers — Detailed

The judgement calls the summary table cannot fit.

## Dependencies

| Situation | ADR? |
|---|---|
| New runtime dependency | **Yes** |
| New dev dependency that changes workflow (test runner, formatter, bundler) | **Yes** |
| New dev dependency that is a plugin for existing tooling (an ESLint plugin, a Prettier plugin) | No |
| Major version upgrade of a framework or a widely-imported library | **Yes** |
| Minor/patch upgrade | No |
| Major upgrade of a leaf dev tool with no API surface in your code | No |
| Removing a dependency still imported anywhere | **Yes** |
| Removing an unused dependency | No |
| Choosing between two libraries that solve the same problem | **Yes** — this is the archetypal ADR |
| Adding a transitive dep already in the lockfile as a direct dep | No |

A dependency ADR must state what you evaluated it against. "We need a date library, we chose date-fns" is not a decision record; "we chose date-fns over dayjs and Luxon because tree-shaking matters for this bundle and we need only four functions" is.

## Data and schema

**Yes** for: new table/collection/entity; column type change; dropping a column; adding a nullable-to-non-nullable constraint; a new index intended to fix a performance problem; changing a primary or foreign key; introducing denormalization; a data backfill.

**No** for: adding a nullable column with an obvious purpose; a seeder; a factory; renaming a column with no consumers.

Any migration that is not reversible is automatically an ADR, and the ADR must state the rollback plan.

## Architecture

**Yes** for: adding a top-level directory; introducing a new layer (a service layer, a repository layer, a DTO layer); splitting a module; adding a background worker or queue; introducing caching; adding a new deployable unit; changing how the frontend and backend communicate.

**No** for: adding a file inside an existing, established directory following the established pattern.

The test is whether the change adds a *concept* someone must learn, or an *instance* of a concept they already know.

## Cross-cutting patterns

These are the highest-value ADRs because they are the hardest to reverse and the most often reinvented inconsistently:

- Authentication and authorization mechanism
- Error handling and propagation strategy
- Client state management approach
- Data fetching and caching strategy
- Form handling and validation approach
- Logging, monitoring, and error reporting
- Feature flagging
- Internationalization

Write one the first time the pattern is established. Every later usage then follows the ADR rather than relitigating it.

## Breaking changes

**Yes**, always, for anything where existing callers stop working:

- Changing a function or method signature that has callers outside its own file
- Changing an API response shape or status code
- Renaming an export, a route, a database column, or an environment variable
- Changing a default value
- Removing a fallback or a compatibility shim
- Tightening validation on an existing input

The ADR must include the migration path for existing callers and how you verified none were missed.

## Performance and algorithms

**Yes** when: you accept a known-suboptimal approach deliberately; you introduce caching, memoization, or denormalization; you change an algorithm's complexity class; you add a background job to move work off the request path.

**No** when: you are simply choosing the correct algorithm the first time — that is the `engineering-standards` baseline, not a decision worth recording.

## Security

**Yes**, always, for anything touching credentials, secret storage, permission models, CORS policy, CSP, rate limiting, input sanitization strategy, or cryptographic choices. Security decisions get re-examined; they need their reasoning attached.

## Explicitly not ADR-worthy

Bug fixes; new features following an established pattern; styling and copy; tests; formatting; local refactors within one file; adding a log line; documentation; dependency patch bumps; reverting an unreleased change from the same session.

## When the user says skip it

The user can waive the gate. Honor it, implement, and note it in `LOG.md`:

> Skipped ADR for the Redis cache introduction at user's request — revisit if it becomes load-bearing.

That line costs nothing and prevents the decision from becoming invisible. Do not argue past a single mention.
