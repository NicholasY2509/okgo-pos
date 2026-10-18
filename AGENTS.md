<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Okgo POS (Nyenyak POS)

Multi-tenant Point of Sale (POS) and Enterprise Operations Management system for hospitality/capsule hotels, including POS transactions, accounting (COA, journal entries, expenses, financial reports), HRIS & payroll, kiosk check-in/booking, vouchers, and realtime socket events.

## Working rules

- **Contract Documents**: Every change must adhere to the four governance documents:
  - Coding conventions and tech stack: [CODINGSTYLE.md](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/CODINGSTYLE.md)
  - Design tokens, typography, and UI rules: [DESIGN.md](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/DESIGN.md)
  - Work log and recent context: [LOG.md](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/LOG.md)
  - Architecture decisions: [docs/adr/](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/docs/adr/)
- **Architecture Pattern**: Strict 5-layer separation: `Schema ➡️ Repository ➡️ Service ➡️ Action ➡️ Hook ➡️ Component`.
- **No Barrel Files**: `index.ts` files are strictly forbidden across the codebase.
- **Naming**: Strictly `kebab-case` for all files and directories.
- **Verification Gate**: Run `npm run typecheck` (`tsc --noEmit`) before declaring any work complete.
- **No decorative emojis**: In code, comments, logs, commit messages, or docs.
- **Atomic Commits**: One logical change per commit following Conventional Commits.
- **ADR Gate**: Major dependency changes, schema migrations, or architecture shifts must be documented in `docs/adr/` before implementation.
