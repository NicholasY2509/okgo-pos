# Okgo POS (Nyenyak POS)

Multi-tenant Point of Sale (POS) and Enterprise Operations Management system for hospitality/capsule hotels, including POS transactions, accounting (COA, journal entries, expenses, financial reports), HRIS & payroll, kiosk check-in/booking, vouchers, and realtime socket events.

## Requirements

- Multi-tenant branch portal under `app/[tenant]/` (`pos/`, `accounting/`, `hris/`, `kiosk/`, `login/`).
- Centralized administrative dashboard under `app/admin/` (`branches/`, `products/`, `staff/`, `users/`, `vouchers/`, `work-positions/`).
- Offline-first PWA caching and receipt handling using Serwist.
- Real-time order sync and event broadcasting via Socket.io.
- Strict 5-layer Domain-Driven Design submission pattern: `Schema ➡️ Repository ➡️ Service ➡️ Action ➡️ Hook ➡️ Component`.

**Out of scope:**
- Direct Prisma database calls inside presentation components or client-facing actions.
- Any barrel `index.ts` files anywhere in the repository.

## Constraints

- Next.js 16.2.6 (App Router) & React 19.2.4 compatibility.
- Node.js runtime environment (v20+ / v25 via Homebrew).
- Database support: SQLite (`better-sqlite3`) for development; MariaDB for production deployment.

## Repository

| | |
| --- | --- |
| Host | GitHub (`https://github.com/NicholasY2509/okgo-pos.git`) |
| Default branch | `main` |
| Branch naming | `<type>/<short-kebab-description>` (e.g. `feat/order-receipt-print`, `fix/staff-payroll-calc`) |
| Deploy target | Docker containerized deployment (`Dockerfile`, `docker-compose.yml`, `nginx.conf`) |
| Environments | Local (`npm run dev`), Staging / Production via Docker compose |

## Working rules

- Commits are atomic and follow Conventional Commits.
- No decorative emojis in code, comments, logs, commit messages, or docs.
- Patterns that must stay consistent are recorded in `CODINGSTYLE.md` (code) and `DESIGN.md` (appearance), not left to memory.
- Verification passes (`npm run typecheck`) before work is reported as done.
- Risky changes, dependencies, or schema migrations require an ADR in `docs/adr/`.

## Project standards

- Coding conventions and tech stack: @CODINGSTYLE.md
- Design tokens and styling rules: @DESIGN.md
- Recent work and session context: @LOG.md
- Architecture decisions: docs/adr/
