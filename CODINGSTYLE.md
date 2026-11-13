# Coding Style

The conventions for this repository. This file governs every change made here.
Facts in the stack table are detected from the code; everything else is a deliberate choice.

> Maintained under Structure. Update the stack table when a dependency changes; update the
> command table when a command changes. Record a code pattern here the second time it is used.
> A stale entry here misleads every future session.

## Tech Stack

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Language | TypeScript | ^5.0.0 | Strict mode enabled in `tsconfig.json` |
| Runtime | Node.js | >=20.0.0 | Recommended via Homebrew / Node v20+ or v25 |
| Framework | Next.js | 16.2.6 | App Router, dynamic tenant routing `[tenant]` |
| Package manager | npm | Authoritative | Authoritative from `package-lock.json` |
| Frontend | React | 19.2.4 | Server and Client components (`use client`) |
| Styling | Tailwind CSS | ^4.0.0 | `@import "tailwindcss";` in `app/globals.css` with OKLCH theme |
| Database | SQLite (Dev) / MariaDB (Prod) | SQLite 3 / MariaDB 10+ | Dev uses `better-sqlite3`, prod uses MariaDB adapter |
| ORM / query layer | Prisma ORM | ^7.8.0 | Driver adapters `@prisma/adapter-better-sqlite3` and `@prisma/adapter-mariadb` |
| State Management | Zustand | ^5.0.14 | Client-side reactive stores |
| Data Fetching | TanStack React Query | ^5.101.0 | Client-side caching and data synchronization |
| Data Table | TanStack React Table | ^8.21.3 | Server & client data grids in `components/ui/data-table.tsx` |
| Authentication | NextAuth.js | ^5.0.0-beta.31 | Prisma adapter `@auth/prisma-adapter` |
| Realtime | Socket.io | ^4.8.3 | Standalone node server `socket-server.js` |
| PWA / Offline | Serwist | ^9.5.11 | `@serwist/next`, service worker compiled to `public/sw.js` |
| Mobile / Tablet | Flutter & Dart | SDK ^3.11.5 | Native Android & iOS app in `nyenyak-portal/` |
| Testing | Vitest | ^4.1.12 | Native ESM TypeScript unit & integration test runner |

### Key libraries

| Library | Used for |
| --- | --- |
| `zod` (^4.4.3) | Schema validation for all domain inputs and actions |
| `react-hook-form` (^7.80.0) | Form state management wired to `@hookform/resolvers/zod` |
| `sonner` (^2.0.7) | Toast notifications for user feedback on form submission & alerts |
| `lucide-react` (^1.17.0) | Icon system throughout POS, admin, and kiosk interfaces |
| `radix-ui` / `@radix-ui/*` | Accessible primitives underlying Shadcn UI components |
| `class-variance-authority` | Variant styling management for UI primitives |
| `framer-motion` & `gsap` | Fluid transitions and animations |
| `http` (`package:http` ^1.6.0) | REST HTTP client in `nyenyak-portal/` for communicating with `nyenyak-pos` APIs |
| `socket_io_client` (`package:socket_io_client` ^3.1.6) | Real-time Socket.io WebSocket client in `nyenyak-portal/` for room session live updates |

## Commands

| Purpose | Command | Notes |
| --- | --- | --- |
| Install | `npm install` | Install dependencies |
| Dev server | `npm run dev` | Runs Next.js (`--webpack`) & Socket.io server via concurrently |
| Format | `npm run format` | Prettier write on `**/*.{ts,tsx}` |
| Lint | `npm run lint` | ESLint 9 using `eslint.config.mjs` |
| Typecheck | `npm run typecheck` | `tsc --noEmit` — must pass with 0 errors |
| Test | `npm test` | Runs automated test suite via Vitest (`vitest run`) |
| Build | `npm run build` | Production bundle build |
| Start | `npm run start` | Production startup with Next.js and Socket.io |
| DB Studio | `npx prisma studio` | Interactive database explorer |
| DB Migration | `npx prisma db push` or `npx prisma migrate dev` | Database schema updates |
| Flutter Analyze | `cd nyenyak-portal && dart analyze` | Static analysis for Nyenyak Portal mobile/tablet app |
| Flutter Test | `cd nyenyak-portal && flutter test` | Widget and unit tests for Nyenyak Portal |

## Conventions

### The 5-Layer Module Architecture

Every domain feature is strictly encapsulated inside `modules/[domain]/` adhering to:
**`Component ➡️ Hook ➡️ Action ➡️ Service ➡️ Repository`**

1. **Schema (`modules/[domain]/schemas/[feature].ts`)**: Zod schema and TypeScript inference type. Single source of truth.
2. **Repository (`modules/[domain]/repositories/[feature]-repository.ts`)**: Prisma database queries only. No business rules, no Next.js imports.
3. **Service (`modules/[domain]/services/[feature]-service.ts`)**: Business logic, orchestration, calculations. No Next.js imports, no direct Prisma queries.
4. **Action (`modules/[domain]/actions/[feature]-action.ts`)**: Server Action (`"use server"`). Validates with Zod, calls Service, catches errors, returns `{ success: true, data }` or `{ error: string }`.
5. **Hook (`modules/[domain]/hooks/use-[feature].ts`)**: Client hook wrapping `react-hook-form` & `zodResolver`. Handles submit, toast notifications (`sonner`), and loading state.
6. **Component (`modules/[domain]/components/[feature]-form.tsx`)**: Pure UI (`"use client"`). Consumes Hook. No manual fetch or database calls.

### Naming

- **Files & Directories**: Strictly `kebab-case` (e.g. `voucher-packet-action.ts`, `use-voucher-packet.ts`, `auth-service.ts`).
- **NO `index.ts` files**: Strictly forbidden anywhere in `modules/` or `app/` to prevent editor tab confusion ("tab hell"). Use explicit filenames.
- **Components**: PascalCase inside kebab-case files (e.g. `export function VoucherPacketForm()`).
- **Hooks**: `use[Feature]` matching `use-[feature].ts`.
- **Database Tables**: PascalCase model names in `schema.prisma`, mapped to snake_case or standard naming.

### Directory layout

- `app/`: Next.js App Router presentation routes only. Does NOT contain raw business logic. Composes components from `modules/`.
  - `app/(marketing)/`: Public landing and booking pages.
  - `app/[tenant]/`: Branch-level portals (`pos/`, `accounting/`, `hris/`, `kiosk/`, `login/`).
  - `app/admin/`: Global administrative dashboard (`branches/`, `products/`, `staff/`, `users/`, `vouchers/`, `work-positions/`).
- `modules/`: Domain business logic (`auth`, `branch`, `product`, `staff`, `user`, `vouchers`, `work-position`, `core`).
- `components/ui/`: Base Shadcn UI primitives (`button.tsx`, `dialog.tsx`, `data-table.tsx`, etc.).
- `lib/`: Shared utilities (`lib/prisma.ts`, `lib/utils.ts`).
- `docs/adr/`: Architecture Decision Records.

### Types

- Strict TypeScript enabled (`tsconfig.json`).
- Derive types from Zod schemas (`z.infer<typeof schema>`) or Prisma generated types (`Prisma.UserGetPayload<...>`).
- Avoid `any`. If a generic wrapper is necessary, use `unknown` or constrained generics.

### Error handling

- Server Actions catch exceptions and return structured JSON: `{ error: string }` or `{ success: true, data: T }`.
- Client hooks display errors using `toast.error(result.error)`.
- Never use silent catch blocks that swallow errors without logging or surfacing feedback.

### Testing and Verification

- `npm run typecheck` (`tsc --noEmit`) must always pass with 0 errors before committing or declaring work complete.
- Verify changes with format and lint checks.

## Non-negotiables

- **No hardcoded values**: Colors, spacing, API endpoints, status codes, and magic numbers must come from tokens, CSS variables, environment variables, or enums.
- **Strict 5-layer separation**: Never query Prisma directly from Server Actions or React components.
- **No `index.ts` files**: Always use explicit filenames for maintainability.
- **No decorative emojis**: No emojis in code, comments, logs, commit messages, or documentation.
- **Atomic Commits**: One logical change per commit following Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
- **Verification Gate**: Work is not done until `npm run typecheck` passes.
- **ADR Gate**: Changes to dependencies, Prisma database schema, architectural structure, or public API signatures require an ADR in `docs/adr/`.

## Off-limits

| Path | Why |
| --- | --- |
| `.next/` | Generated Next.js build artifacts |
| `public/sw.js` | Generated Serwist service worker bundle |
| `node_modules/` | Managed dependencies |
| `scratch/` | Temporary scratchpad scripts and test dumps |
| `*.log`, `diff.txt`, `dummy.txt` | Transient files |

## Migrating away from

| Pattern | Replace with |
| --- | --- |
| Direct Prisma queries in Server Actions | Encapsulate queries in `[feature]-repository.ts` and call via `[feature]-service.ts` |
| Native `fetch()` calls in Client Components | Use Server Actions with custom hooks or TanStack Query |
| `index.ts` barrel files | Explicit file imports (e.g. `modules/auth/services/auth-service.ts`) |
