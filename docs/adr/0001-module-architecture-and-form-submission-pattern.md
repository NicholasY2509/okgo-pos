# ADR-0001: Enforce Domain-Driven 5-Layer Submission Pattern and Ban Index Files

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Okgo POS Engineering Team

## Context

In Next.js App Router applications, it is common for developers to mix server actions, raw database queries, and client form state directly inside components or generic API routes. As features grew across POS transactions, branch management, accounting, and staff records, this led to fat components, duplicated queries, and blurred security boundaries. Furthermore, widespread usage of barrel files (`index.ts`) resulted in severe "tab hell" in IDEs and circular import hazards.

## Decision

We enforce a strict Domain-Driven Design (DDD) module pattern inside `modules/[domain]/`.
Every data submission flow must be strictly segregated into five layers:
`Component ➡️ Hook ➡️ Action ➡️ Service ➡️ Repository`

1. **Schema (`schemas/[feature].ts`)**: Zod schema and input types.
2. **Repository (`repositories/[feature]-repository.ts`)**: Pure Prisma database queries. No Next.js or HTTP dependencies.
3. **Service (`services/[feature]-service.ts`)**: Pure business logic, validation, and calculations. Orchestrates Repositories.
4. **Action (`actions/[feature]-action.ts`)**: Server Action (`"use server"`). Bridges client and service, validates input, handles exceptions.
5. **Hook (`hooks/use-[feature].ts`)**: Client React hook wrapping `react-hook-form`, `zodResolver`, and `sonner` toast alerts.
6. **Component (`components/[feature]-form.tsx`)**: Dumb UI presentation consuming the hook.

Additionally:
- Barrel `index.ts` files are strictly banned throughout the repository. All imports must reference explicit filenames (e.g. `modules/auth/services/auth-service.ts`).
- All files and folders must strictly follow `kebab-case`.

## Consequences

### Easier

- Clear separation of concerns; repositories can be mocked or swapped (e.g. SQLite to MariaDB) without touching UI.
- Consistent error handling and toast notifications across all admin and POS forms.
- File navigation in editors is instant and unambiguous without overlapping `index.ts` tabs.

### Harder

- Adding simple CRUD features requires creating 5 distinct files instead of writing inline mutations.
- Developers must maintain discipline and avoid shortcutting database access directly in Server Actions.

## Alternatives considered

### Inline Server Actions in Component Files
- Rejected because it couples database queries to presentation logic and prevents reuse across CLI scripts or background jobs.

### Traditional Controller-Service with Barrel `index.ts` Files
- Rejected because barrel files degrade tree-shaking performance, risk circular imports, and cause developer confusion when dozens of `index.ts` tabs are open.
