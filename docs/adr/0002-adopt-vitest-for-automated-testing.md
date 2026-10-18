# ADR-0002: Adopt Vitest for Automated Unit and Domain Engine Testing

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Okgo POS Engineering Team

## Context

The repository had 0 automated unit or integration tests, meaning regressions in critical business logic—such as payroll salary calculation engines, discount cart rules, and accounting balance assertions—could only be caught manually or through TypeScript static compilation. We need a fast, ESM-native, TypeScript-first test runner that integrates smoothly with Next.js 15+ and Node.js without requiring complex Babel or Webpack transform setups.

## Decision

We adopt **Vitest** as the project's official test runner for unit and integration testing.
Tests are co-located alongside features or in dedicated domain test directories matching `*.test.ts`.
A new script `"test": "vitest run"` is added to `package.json`.

## Consequences

### Easier

- Native TypeScript and ESM support without transform overhead.
- Instant feedback loop for testing core pure logic engines (`payroll-engine`, `promotion-service`, `journal-entry-service`).
- Compatible with Vite/Next ecosystem.

### Harder

- Adds a development dependency (`vitest`) to `package.json`.
- Developers must maintain test cases when changing core calculations.

## Alternatives considered

### Jest
- Rejected due to complex ESM configuration requirements and slower execution with Next.js TypeScript files.

### Manual Verification Only
- Rejected because enterprise operations management systems (accounting, payroll, transactions) require deterministic calculation correctness that manual QA cannot reliably guarantee.
