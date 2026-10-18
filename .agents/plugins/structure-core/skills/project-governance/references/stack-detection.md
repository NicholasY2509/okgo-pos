# Stack Detection

Read the stack from the repository. Facts that a file states are never interview questions.

## Procedure

1. List the repo root. Manifests and lockfiles are the highest-signal files.
2. Read every manifest found — not just the first. A repo can be Laravel *and* Vue, or Nx *and* Poetry.
3. Read the lockfile only to resolve an actual installed version when the manifest gives a range and the version matters (a major-version boundary, a known breaking change). Lockfiles are large; never read one whole.
4. Read config files for conventions the manifest does not carry: formatter width, indent, lint rules, path aliases.
5. Read 2–3 representative source files to confirm the conventions are actually followed. A `.prettierrc` that the codebase ignores is not the convention.

## Signal table

| File | Establishes |
|---|---|
| `package.json` | JS/TS runtime deps, dev deps, **scripts** (the command vocabulary), `type`, `packageManager` |
| `pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` / `bun.lockb` | Package manager — this is authoritative, override any assumption |
| `composer.json` | PHP deps, PHP version constraint, autoload PSR-4 roots, `scripts` |
| `pyproject.toml` / `requirements.txt` / `poetry.lock` | Python deps, tooling (ruff, black, mypy), Python version |
| `go.mod`, `Cargo.toml`, `Gemfile`, `pubspec.yaml`, `*.csproj` | Language, module path, dependency set |
| `nx.json` / `turbo.json` / `lerna.json` / `pnpm-workspace.yaml` | Monorepo — task running goes through the orchestrator, not raw scripts |
| `tsconfig.json` | `strict`, path aliases, target, module resolution |
| `.prettierrc`, `.editorconfig` | Indent width, quote style, print width, line endings |
| `eslint.config.*` / `.eslintrc*` | Lint ruleset and plugins |
| `pint.json`, `phpcs.xml`, `.php-cs-fixer.php` | PHP formatting standard |
| `ruff.toml`, `setup.cfg` | Python lint/format standard |
| `tailwind.config.*` or `@theme` in a CSS file | Tailwind, and its version — v4 is CSS-first with no JS config |
| `components.json` | shadcn/ui or shadcn-vue, plus alias paths |
| `.github/workflows/`, `.gitlab-ci.yml` | The commands CI actually runs — the ground truth for verification |
| `commitlint.config.*`, `.husky/` | Commit message contract, pre-commit hooks |
| `Dockerfile`, `docker-compose.yml` | Services, runtime versions, ports |
| `.git/config` remote URL | GitHub vs GitLab — decides PR vs MR in `commit-workflow` |

## Framework fingerprints

Confirm a framework by a file that only that framework produces, not by a dependency name alone.

| Framework | Fingerprint |
|---|---|
| Laravel | `artisan` at root, `bootstrap/app.php` |
| Inertia | `@inertiajs/*` dep plus `Inertia::render` in controllers |
| Next.js App Router | `app/` with `layout.tsx` |
| Next.js Pages Router | `pages/` with `_app.tsx` |
| NestJS | `*.module.ts` with `@Module` |
| Vue SFC | `.vue` files, `@vitejs/plugin-vue` |
| React Native / Expo | `app.json` with `expo` key, `metro.config.js` |
| Django | `manage.py`, `settings.py` |
| FastAPI | `FastAPI()` instantiation |

## Version boundaries that change the guidance

When detected, these are worth an explicit line in `CODINGSTYLE.md` because getting them wrong produces plausible-looking broken code:

- **Tailwind v4** — CSS-first `@theme`, no `tailwind.config.js`, no `corePlugins`, opacity utilities replaced (`bg-opacity-*` → `bg-black/*`).
- **Laravel 11+** — no `app/Http/Middleware/` kernel, no `app/Console/Kernel.php`; registration happens in `bootstrap/app.php`.
- **Next.js 15+** — `params` and `searchParams` are Promises in Server Components.
- **React 19** — `forwardRef` no longer required; `ref` is a normal prop.
- **ESLint 9** — flat config only.
- **Vue 3** — Composition API with `<script setup>` unless the repo demonstrably uses Options API.

## Deriving the command vocabulary

The most valuable output of detection is the list of commands that actually work in this repo. Build it from, in priority order:

1. **CI workflow files.** What CI runs is what must pass. This is the strongest signal.
2. **`scripts` in the manifest.** Use the script name (`pnpm lint`), not the underlying binary.
3. **Monorepo orchestrator.** In Nx/Turbo, prefer `nx lint <project>` over running the linter directly, so project config and caching apply.
4. **Known framework defaults.** Only as a fallback when nothing above exists.

Record the result in the `CODINGSTYLE.md` command table and reuse it in `verification-gate`. If a detected command fails on first use, correct the table rather than working around it.

## When detection is ambiguous

Ambiguity is a question, not a guess. Two lockfiles, two formatters with conflicting settings, or a config the code ignores — ask the user which is authoritative and record the answer in `CODINGSTYLE.md` so it is never ambiguous again.
