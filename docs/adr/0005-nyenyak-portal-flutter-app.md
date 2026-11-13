# ADR-0005: Introduce Nyenyak Portal Flutter Application in Monorepo

- **Status:** Accepted
- **Date:** 2026-10-28
- **Deciders:** Okgo POS Engineering Team

## Context

Alongside the Next.js web application (`nyenyak-pos`), the business needs a dedicated native mobile and tablet portal application called **Nyenyak Portal** targeting Android and iOS devices. Initially, this application provides Email and Password authentication aligned with the Nyenyak brand design system (`DESIGN.md`) and will grow to interact with the Nyenyak backend APIs.

We needed to decide where to house the Flutter codebase and how to structure its architecture so it coexists cleanly with the Next.js codebase without polluting TypeScript, ESLint, or Next.js build pipelines.

## Decision

We create a top-level Flutter application directory at `./nyenyak-portal` (Dart package name `nyenyak_portal`) targeting Android and iOS platforms:

1. **Directory Isolation**:
   - All Flutter/Dart source code and platform runners live under `./nyenyak-portal/`.
   - Root `tsconfig.json` and `eslint.config.mjs` exclude `nyenyak-portal/**` so web typechecking and linting remain fast and isolated.
2. **Design Token Alignment**:
   - The Flutter theme (`lib/core/theme/nyenyak_theme.dart`) mirrors the OKLCH brand tokens from `DESIGN.md` (warm gold primary `#F59E0B` / `oklch(0.795 0.184 86.047)`, neutral slate/zinc surfaces, 10px base control radius, and Light/Dark mode support).
3. **Layered Feature Structure**:
   - Features inside `nyenyak-portal/lib/features/[domain]/` follow a clean layered separation (`models`, `repositories`, `services`, `controllers`, `presentation`) analogous to the repository's DDD philosophy.

## Consequences

### Easier

- Single repository for coordinated full-stack changes across the Next.js backend and the Flutter mobile/tablet client.
- Shared governance (`DESIGN.md`, `LOG.md`, `docs/adr/`) keeps visual tokens and architectural decisions synchronized.

### Harder

- Developers working on mobile features need the Flutter SDK installed alongside Node.js.
- CI pipelines and root tooling must scope checks by directory (`npm run typecheck` at root vs `flutter analyze` and `flutter test` in `nyenyak-portal/`).

## Alternatives considered

### Separate Git Repository (`../nyenyak-portal`)
- Rejected because coordinating API contract changes, design tokens, and session logs across two repositories adds overhead during active development.

### Nested `apps/` Workspace (`./apps/nyenyak-portal`)
- Rejected to avoid restructuring the existing root Next.js layout into a multi-package workspace when only a single mobile companion app is needed.

