# Log

Working context for this repository, newest first. This is a handoff document for the next
session — it records what the code cannot say for itself.

> Maintained under Structure. Append after completing a unit of work.
> Record why, what was rejected, gotchas, and where you stopped — not a diff summary.
> Keep 10 entries verbatim; compact the rest into Consolidated history. Delete lines whose
> value has expired.

## 2026-10-19 — Booking Wizard: Minimalist Compacted Service Card & Intuitive Therapist Selection

**Did:**
1. Refactored [`StepServices`](modules/booking/components/steps/step-services.tsx) to automatically and smoothly compact completed services using `framer-motion` (`AnimatePresence`).
2. Redesigned the compacted service card with minimalist luxury typography consistent with Nyenyak POS design tokens, removing superfluous icon badges.
3. Updated therapist selection to start in a neutral/empty state (neither "Siapa Saja" nor specific staff pre-selected) while keeping "Siapa Saja" as an immediate, intuitive selectable option.
4. Cleaned up unnecessary collapse/done buttons in favor of natural selection-driven collapsing.
5. Accounted for unassigned bookings and room capacity in [`BookingRepository`](modules/booking/repositories/booking-repository.ts) and [`StepTime`](modules/booking/components/steps/step-time.tsx).
6. Verified with `npm test` (12/12 passing) and `npm run typecheck` (`tsc --noEmit`, 0 errors).

---

## 2026-10-18 — Transaction History: Single Date Filter with Navigation Controls

**Did:**
1. Updated [`useTransactions`](modules/pos/hooks/use-transactions.ts) hook to filter by a single date (`date: Date | undefined`), defaulting to today (`new Date()`).
2. Updated [`TransactionHistoryClient`](modules/pos/components/transaction-history-client.tsx) to replace `DatePickerWithRange` with `DatePicker`.
3. Added previous day (`ChevronLeft`), next day (`ChevronRight`), and quick "Hari Ini" buttons for fast date stepping.
4. Verified with `npm test` (12/12 passing) and `npm run typecheck` (`tsc --noEmit`, 0 errors).

---

## 2026-10-18 — Booking List: Single Date Filter

**Did:**
1. Replaced `DatePickerWithRange` with `DatePicker` in [`BookingList`](modules/booking/components/booking-list.tsx) to allow selecting a single date rather than a date range.
2. Synchronized `date` query parameter (`yyyy-MM-dd`) in URLSearchParams while maintaining fallback compatibility for legacy `from`/`to` parameters in [`TenantBookingsPage`](app/[tenant]/(main)/bookings/page.tsx).
3. Verified via `npm test` (12/12 passing) and `npm run typecheck` (`tsc --noEmit`, 0 errors).

---

## 2026-10-18 — Voucher Accounting Refactor: Direct Revenue Recognition (ADR-0003)

**Did:**
1. Created and switched to branch `feat/voucher-direct-revenue-accounting` per branch-workflow rules.
2. Recorded [ADR-0003: Direct Revenue Recognition for Voucher Purchases](docs/adr/0003-voucher-direct-revenue-accounting.md) and indexed it in `docs/adr/README.md`.
3. Added account `413` (`Pendapatan Voucher`, type: `REVENUE`, `isLocked: true`) to `prisma/seed.ts`.
4. Refactored `JournalEntryAutomation.handleTransactionCompleted` in `modules/accounting/services/journal-entry-automation.ts`:
   - Voucher packet sales credit `413 Pendapatan Voucher` directly upon purchase (with fallback to `411` if unseeded).
   - Removed unearned revenue liability booking to account `214`.
   - Prevented revenue double-counting on voucher redemptions: redeeming a voucher does not create secondary revenue or liability entries for the voucher-covered portion.
5. Streamlined `VoucherExpirationService.processExpiredVouchers` in `modules/accounting/services/voucher-expiration-service.ts`:
   - Marks expired vouchers as `EXPIRED` without generating redundant breakage journal entries, as revenue was already recognized 100% on purchase.
6. Created automated unit test suite `modules/accounting/services/journal-entry-automation.test.ts` (3 tests) covering:
   - Direct credit to `413` upon voucher purchase.
   - Fallback to `411` when `413` is not seeded.
   - Zero-entry suppression on 100% voucher-redeemed transactions.
7. Verified with `npm test` (12/12 passing across 4 suites) and `npm run typecheck` (`tsc --noEmit`, 0 errors).

**Why:**
Per business requirement, voucher packet sales represent immediate realized income rather than deferred unearned liabilities (`214`), simplifying bookkeeping and aligning revenue timing with cash collection.

**Watch out:**
- Existing databases that have not re-run `prisma db seed` will automatically fall back to `411 Pendapatan Penjualan`. Run seed when practical to establish separate `413` reporting.

---

## 2026-10-18 — Code Quality Remediation: React Hooks, Action Auth & 5-Layer Purity

**Did:**
1. Switched to dedicated branch `fix/code-quality-remediation` per branch-workflow rules.
2. Eliminated conditional React Hook order violations in `categories-table.tsx` and `products-table.tsx` by unconditionally declaring `useMemo` above empty state guards.
3. Configured `globalIgnores` in `eslint.config.mjs` to ignore `lib/generated/**`, eliminating 1,728 false-positive lint issues generated from compiled Prisma artifacts.
4. Created reusable `AuthGuardService` in `modules/auth/services/auth-guard-service.ts` supporting session verification and RBAC role gating for Server Actions.
5. Systematically secured Server Actions across the entire enterprise stack (over 30 action files hardened with `AuthGuardService.requireAuth()` and typed `catch (error: unknown)`):
   - POS, Timetable & Transactions: `pos-action.ts`, `timetable-action.ts`, `transaction-action.ts`.
   - Accounting: `journal-entry-action.ts`, `ledger-account-action.ts`, `report-action.ts`.
   - Vouchers: `voucher-packet-action.ts`, `get-customer-vouchers-action.ts`.
   - User Management & Staff-User: `user-action.ts`, `staff-user-action.ts`.
   - Branch Management: `branch-action.ts`.
   - Role & Competency: `role-action.ts`, `work-position-action.ts`.
   - Staff & Onboarding: `staff-action.ts`, `staff-onboarding-action.ts`, `staff-salary-action.ts`, `staff-incentive-action.ts`, `incentive-rule-action.ts`, `staff-machine-action.ts`.
   - Payment Methods & Discounts: `payment-method-action.ts`, `promotion-action.ts`.
   - Brand Settings & Facility: `brand-setting-action.ts`, `room-action.ts`.
   - Product Catalog: `product-action.ts`, `category-action.ts`.
   - Payroll & Attendance: `payroll-action.ts`, `salary-component-action.ts`, `attendance-action.ts`, `attendance-calculation-action.ts`, `attendance-working-hour-action.ts`, `attendance-schedule-import-action.ts`, `working-hour-action.ts`, `attendance-machine-action.ts`, `attendance-status-action.ts`.
   - Customer & Marketing: `customer-action.ts`, `marketing-offer-action.ts`.
   - Booking & Service Sessions: `booking-actions.ts`, `booking-list-actions.ts`, `service-session-action.ts`.
   - Kiosk & Auth: `kiosk-action.ts`.
6. Enforced strict 5-layer separation by removing raw Prisma queries and dynamic repository imports from Server Actions:
   - `modules/payroll/actions/payroll-action.ts` now retrieves active employees through `StaffService.getActiveStaffIds()`.
   - `modules/pos/actions/pos-action.ts` resolves cashier links through `StaffUserService.findByUserId()`.
   - `modules/pos/actions/timetable-action.ts` now routes session room relocations through `TimetableService.updateSessionRoom()`, eliminating dynamic repository imports.
   - `modules/attendance/actions/attendance-schedule-import-action.ts` now delegates database reads and transaction batch replacements to `WorkingHourService` and `AttendanceWorkingHourService`.
   - `modules/attendance/actions/attendance-working-hour-action.ts` delegates deletions to `AttendanceWorkingHourService.deleteSchedule()`.
7. Updated `socket-server.js` with room-based multi-tenant isolation (`socket.join(branchId)`) to prevent cross-branch websocket event leakage.
8. Enhanced TypeScript types in `modules/product/types/product-types.ts`, typing `CategoryWithRelations` and `ProductWithCategory` to remove prop `any[]` types in tables and columns.
9. Recorded ADR-0002 for Vitest adoption (`docs/adr/0002-adopt-vitest-for-automated-testing.md`) and installed `vitest`.
10. Added automated unit test suites with 100% pass rate:
    - `modules/auth/services/auth-guard-service.test.ts` (4 tests)
    - `modules/discount/services/promotion-service.test.ts` (2 tests)
    - `modules/payroll/services/payroll-engine.test.ts` (3 tests)
11. Ran `npm test` and `npm run typecheck` (`tsc --noEmit`), passing with 0 errors (9/9 tests passed in ~150ms).

**Why:**
To eliminate runtime hook crashes, secure Server Action mutation endpoints against unauthenticated invocation, restore 5-layer architecture compliance, and establish automated regression test coverage.

**Watch out:**
- Server Actions should consistently use `AuthGuardService.requireAuth()` for mutating operations.
- `npm test` runs via Vitest without needing Vite or Webpack dev server running.
- In test files mocking NextAuth, use `vi.mocked(authModule.auth).mockResolvedValue(...)` with explicit typing to handle overloaded function signatures.

**Next:**
- Merge `fix/code-quality-remediation` into `main` after user review.

---

## 2026-10-18 — System Documentation, ERD & Feature Catalog Published to Notion

**Did:**
Created and synchronized comprehensive documentation pages in the Notion hub `Nyenyak Documentation`:
1. `Nyenyak POS - System Documentation`: Architecture principles, 5-layer submission pattern, tech stack, design tokens, and verified toolchain.
2. `Nyenyak POS - Entity Relationship Diagram (ERD) & Schema Reference`: Comprehensive Mermaid ERD and entity specifications across all 12 schema domains.
3. `Nyenyak POS - Features & Modules Catalog`: Comprehensive catalog of all 28 modules spanning POS checkout, reservations, biometric attendance, HRIS & payroll, and double-entry accounting.
4. `Nyenyak POS - Module Specification: Point of Sale (POS) & Transactions`: In-depth specification of the POS module, covering cashier workflows, Zod cart schemas, atomic checkout mutations, split-payment settlement, "Bayar Nanti" pay-later mechanics, automated ledger integration, and thermal receipt hardware.
5. `Nyenyak POS - Module Specification: Vouchers & Customer Packages`: In-depth specification of the Vouchers module, covering visit quotas vs credit balances, automated POS minting, cashier incentives, redemption validation, and audit tracking.
6. `Nyenyak POS - Module Specification: Timetable, Bookings & Service Sessions`: In-depth specification of the Timetable and Booking systems, covering reservation lifecycles, lead-time availability algorithms, Gantt chart matrix scheduling, real-time Socket.io events, therapist reassignments, and payment completion gates.
7. `Nyenyak POS - Module Specification: HRIS, Staff Directory & Biometric Attendance`: In-depth specification of staff management and biometric integration, covering multipart webhook ingestion, punch-to-attendance normalization, shift definitions, late/overtime detection, and disciplinary penalty rules.
8. `Nyenyak POS - Module Specification: Payroll, Salary Components & Incentive Engine`: In-depth specification of employee compensation, covering effective-dated base salaries, conditional attendance bonuses (perfect week/month), multi-tier commission structures, automated disciplinary penalties, and immutable paid payslips.
9. `Nyenyak POS - Module Specification: Financial Management & Double-Entry Accounting`: In-depth specification of double-entry bookkeeping, covering Chart of Accounts (COA) normal balances, automated POS checkout journal generation, split-tender handling, unearned voucher liability recognition, and financial reports (P&L, Balance Sheet, Trial Balance, Ledger).
10. `Nyenyak POS - Module Specification: Promotions & Dynamic Cart Discounts`: In-depth specification of promotional discount rules, covering time-based happy hour schedules, minimum quantity conditions, required treatment triggers, reward types (total/item percentage, free add-ons), and real-time cart evaluation.
11. `Nyenyak POS - Module Specification: Multi-Tenant Branch & Facility Management`: In-depth specification of organizational topology and facility infrastructure, covering subdomain/slug multi-tenant routing, cross-branch staff assignments, room capacity tracking, and global operational brand hours.
12. `Nyenyak POS - Module Specification: Products, Services & Treatment Catalog`: In-depth specification of the treatment and merchandise catalog, covering minute-based service duration constraints, category work position specialization, omnichannel marketing publication flags, and product bundling.
13. `Nyenyak POS - Module Specification: Security, RBAC & Core Infrastructure`: In-depth specification of authentication, authorization, edge routing, Serwist PWA offline caching, and Socket.io event bus, covering Cloudflare-aware multi-tenant subdomain resolution and dual-identity staff security.
14. `Nyenyak POS - Module Specification: Customer Directory, Feedback & Reviews`: In-depth specification of customer relationship management, fast POS omnisearch, lifetime spending analytics, prepaid voucher portfolio tracking, and dedicated in-store tablet review surveys.
15. `Nyenyak POS - Module Specification: Self-Service Kiosk & Therapist Terminal`: In-depth specification of touch-screen in-room tablet terminals, covering PIN-authenticated fast operator switching, live session timer tracking, real-time Socket.io audio/visual dispatch alerts, and queue/history management.
16. `Nyenyak POS - Module Specification: Payment Methods & Tender Management`: In-depth specification of checkout tender methods, split-payment allocations, change calculations, active status management, and direct bindings to General Ledger asset accounts.
17. `Nyenyak POS - Module Specification: Work Positions, Job Roles & Competency Mapping`: In-depth specification of enterprise role hierarchy, treatment category competency mapping (`targetWorkPositionId`), tiered incentive rule scoping, and automated salary allowance entitlements.

**Why:**
To maintain centralized, durable external system documentation and clear technical reference for team members and future sessions.

**Watch out:**
- Notion pages are organized under the parent hub `Nyenyak Documentation`.
- ERD reflects the multi-file schema under `prisma/schema/*.prisma`.
- All 28 modules across the entire Okgo POS codebase now possess comprehensive deep-dive architectural specifications.

**Next:**
Maintain and update Notion documentation alongside future code refactors and feature enhancements.

---

## 2026-10-18 — Structure Project Governance Bootstrap & Plugin Installation

**Did:**
Installed the Structure Core plugin into global (`~/.gemini/config/plugins/structure-core`) and project workspace (`.agents/plugins/structure-core`), established the Four-Document Contract (`CODINGSTYLE.md`, `DESIGN.md`, `LOG.md`, `docs/adr/`), recorded ADR-0001 for the 5-layer module architecture, and configured ESLint to ignore the generated `public/sw.js` bundle.

**Why:**
To enforce deterministic coding standards, ensure continuous verification discipline, eliminate configuration drift, and integrate the Structure project governance workflow into the Nyenyak POS application.

**Watch out:**
- ESLint ignores `public/sw.js` (generated by Serwist PWA compiler). If running raw eslint on everything, ensure `public/sw.js` is not scanned as it contains minified service worker bundles.
- Never add `index.ts` files inside `modules/` or `app/` — explicit filenames are strictly enforced to avoid editor tab confusion.
- Pre-existing lint warnings in scripts and modules (such as `@typescript-eslint/no-explicit-any`) are cataloged; `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.

**Open:**
None for governance setup.

**Next:**
Proceed with feature development adhering to `CODINGSTYLE.md` and the 5-layer DDD module pattern.

---

## Consolidated history

<!-- Compacted entries will be placed here over time. -->
