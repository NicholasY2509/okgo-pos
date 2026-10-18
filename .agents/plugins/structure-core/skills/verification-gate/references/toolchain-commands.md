# Toolchain Commands

Fallback command sets by stack, used only when CI files and manifest scripts do not answer the question. Always prefer what the repo actually declares.

## JavaScript / TypeScript

Detect the package manager from the lockfile — this is not optional, running `npm` in a pnpm repo corrupts state.

| Lockfile | Runner |
|---|---|
| `pnpm-lock.yaml` | `pnpm` / `pnpm exec` |
| `yarn.lock` | `yarn` / `yarn dlx` |
| `package-lock.json` | `npm` / `npx` |
| `bun.lockb` | `bun` / `bunx` |

| Step | Command |
|---|---|
| Format | `<pm> exec prettier --write <paths>` |
| Lint | `<pm> exec eslint <paths> --fix` |
| Typecheck (TS) | `<pm> exec tsc --noEmit` |
| Typecheck (Vue) | `<pm> exec vue-tsc --noEmit` |
| Test (Jest) | `<pm> exec jest <pattern>` |
| Test (Vitest) | `<pm> exec vitest run <pattern>` |
| Build | `<pm> run build` |

**Nx monorepo** — go through the orchestrator so project-level config and caching apply:
`nx lint <project>` · `nx test <project> --passWithNoTests` · `nx build <project>` · `nx affected -t lint,test` for a changed-projects run.

**Turborepo** — `turbo run lint --filter=<package>`.

## PHP / Laravel

| Step | Command |
|---|---|
| Format | `vendor/bin/pint` (add `--dirty` to limit to changed files) |
| Static analysis | `vendor/bin/phpstan analyse` or `vendor/bin/psalm` if configured |
| Test (all) | `php artisan test` |
| Test (file) | `php artisan test tests/Feature/ExampleTest.php` |
| Test (filter) | `php artisan test --filter=testName` |

Laravel specifics worth remembering:
- Run `vendor/bin/pint` (write), never `pint --test`, when the intent is to fix.
- A `ViteException: Unable to locate file in Vite manifest` is a missing frontend build, not a PHP defect — `npm run build`.
- After route or controller changes in a Wayfinder project, `php artisan wayfinder:generate` before typechecking the frontend.

## Python

| Step | Command |
|---|---|
| Format | `ruff format .` or `black .` |
| Lint | `ruff check . --fix` or `flake8` |
| Typecheck | `mypy .` or `pyright` |
| Test | `pytest <path>` |

Under Poetry, prefix with `poetry run`. Under uv, `uv run`.

## Go, Rust, Others

| Stack | Format | Lint | Test |
|---|---|---|---|
| Go | `gofmt -w .` | `go vet ./...` | `go test ./...` |
| Rust | `cargo fmt` | `cargo clippy -- -D warnings` | `cargo test` |
| Ruby | `rubocop -a` | `rubocop` | `bundle exec rspec` |
| Dart/Flutter | `dart format .` | `flutter analyze` | `flutter test` |
| .NET | `dotnet format` | — | `dotnet test` |

## Windows notes

The user's primary shell is PowerShell, with Git Bash also available.

- PowerShell 5.1 has no `&&` or `||`. Chain with `;` and `if ($?) { }`, or run the commands as separate calls.
- Paths containing `[` and `]` (Next.js dynamic routes) must be quoted in PowerShell, and are glob metacharacters in Bash — quote them in both.
- Prefer forward slashes in arguments passed to Node-based tools; they handle both, and backslashes get eaten as escapes in Bash.

## Writing the table into CODINGSTYLE.md

Once derived, record it so it is never re-derived:

```markdown
## Commands

| Purpose | Command |
| --- | --- |
| Dev server | `composer run dev` |
| Format | `vendor/bin/pint` + `npm run format` |
| Lint | `npm run lint` |
| Typecheck | `npx vue-tsc --noEmit` |
| Test | `php artisan test --filter=<name>` |
| Build | `npm run build` |
```

If a listed command fails on first use, correct the table in the same session rather than working around it. A wrong command table is worse than none — it gets trusted.
