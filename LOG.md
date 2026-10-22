# Log

Working context for this repository, newest first. This is a handoff document for the next
session — it records what the code cannot say for itself.

> Maintained under Structure. Append after completing a unit of work.
> Record why, what was rejected, gotchas, and where you stopped — not a diff summary.
> Keep 10 entries verbatim; compact the rest into Consolidated history. Delete lines whose
> value has expired.

## 2026-10-22 — Attendance Machine Log Ingestion Filter & Trash Purge

**Did:**
1. Investigated root cause of trash raw records: visible light biometric terminals log every face detection attempt (passersby, strangers, visitors) with `UserID: ""`, `Status: 0`, and `CardName: ""`.
2. Updated schema [`syncAttendanceSchema`](modules/attendance-log/schemas/sync-attendance-schema.ts) with `ignoreUnrecognized: boolean`.
3. Extended [`AttendanceSyncRepository`](modules/attendance-log/repositories/attendance-sync-repository.ts) with `purgeUnrecognizedLogs` to delete raw machine logs without a valid user ID or matching name.
4. Updated [`AttendanceSyncService`](modules/attendance-log/services/attendance-sync-service.ts):
   - Added automatic filtering during ingestion when `ignoreUnrecognized` is active, tracking `unrecognizedSkipped`.
   - Updated `ATTENDANCE_STATES[0]` from confusing `"Tidak Dikenal"` to `"Scan Normal"` (default verification state when employees scan without tapping punch state buttons).
   - Added `purgeUnrecognizedLogs` service method.
5. Added server action `purgeUnrecognizedLogsAction` in [`modules/attendance-log/actions/sync-attendance-action.ts`](modules/attendance-log/actions/sync-attendance-action.ts).
6. Updated client hook [`useSyncAttendance`](modules/attendance-log/hooks/use-sync-attendance.ts) with `isPurging` and `purgeUnrecognized()`.
7. Created [`PurgeUnrecognizedDialog`](modules/attendance-log/components/purge-unrecognized-dialog.tsx) with confirmation alert and integrated it into [`AttendanceLogPage`](app/admin/(main)/attendance-log/page.tsx).
8. Added `ignoreUnrecognized` toggle to [`SyncAttendanceDialog`](modules/attendance-log/components/sync-attendance-dialog.tsx).
9. Updated [`columns.tsx`](modules/attendance-log/components/columns.tsx) and [`attendance-log-filters.tsx`](modules/attendance-log/components/attendance-log-filters.tsx) to label State 0 as `"Scan Normal (0)"`.
10. Executed purge on existing 84 unrecognized logs in database, keeping 59 valid employee attendance logs intact.
11. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors).

**Why:**
Biometric terminals in high-traffic hotel environments continuously log unregistered passerby faces. Without ingestion filtering and purge capabilities, raw attendance logs quickly flood with hundreds of irrelevant records, obscuring actual employee check-ins.

---

## 2026-10-21 — Attendance Machine IP Registry & Raw Log Sync Pipeline (ADR-0004)

**Did:**
1. Documented [ADR-0004: Store Attendance Machine Network IP and Port](docs/adr/0004-store-attendance-machine-network-ip.md) and updated `docs/adr/README.md`.
2. Extended `AttendanceMachine` data model in `prisma/schema/attendance.prisma` with `ipAddress String?` and `port Int? @default(80)`.
3. Pushed schema changes to MySQL database with `npx prisma db push` and regenerated client via `npx prisma generate`.
4. Updated existing machine `S118001804` in database with `ipAddress: "192.168.1.231"` and `port: 80`.
5. Updated schema in `modules/attendance-machine/schemas/attendance-machine.ts` with optional `ipAddress` and `port`.
6. Enhanced `modules/attendance-machine/components/machine-form.tsx` to include IP Address and Port inputs.
7. Enhanced `modules/attendance-machine/components/machine-table.tsx` to display machine IP and Port in a dedicated column.
8. Updated `modules/attendance-machine/hooks/use-attendance-machine.ts` to manage IP and Port form state.
9. Implemented raw attendance log synchronization pipeline:
   - Schema: `modules/attendance-log/schemas/sync-attendance-schema.ts`.
   - Repository: `modules/attendance-log/repositories/attendance-sync-repository.ts`.
   - Service: `modules/attendance-log/services/attendance-sync-service.ts` with native HTTP Digest Authentication fetcher.
   - Action: `modules/attendance-log/actions/sync-attendance-action.ts`.
   - Hook: `modules/attendance-log/hooks/use-sync-attendance.ts`.
   - Component: `modules/attendance-log/components/sync-attendance-dialog.tsx` featuring 1-click registered machine selection and live sync metrics.
10. Added "Tarik Log dari Mesin" button to `app/admin/(main)/attendance-log/page.tsx`.
11. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors).

**Why:**
To allow each physical attendance machine to have its network address persisted in the database, eliminate hardcoded IPs, and enable 1-click on-demand synchronization of raw attendance records.

---

## 2026-10-20 — Staff & Branch Assignment Flow & UX Overhaul

**Did:**
1. Extended branch schemas with `bulkAssignStaffSchema`, `transferBranchStaffSchema`, and `bulkTransferStaffSchema` in [`modules/branch/schemas/branch-schema.ts`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/branch/schemas/branch-schema.ts).
2. Added transactional bulk assignment (`bulkAssignStaff`), 1-step branch transfer (`transferBranchStaff`), and bulk branch transfer (`bulkTransferStaff`) to [`BranchRepository`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/branch/repositories/branch-repository.ts) and [`BranchService`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/branch/services/branch-service.ts).
3. Created server actions `bulkAssignStaffAction`, `transferBranchStaffAction`, and `bulkTransferStaffAction` with comprehensive path revalidation (`/admin/branches`, `/admin/staff`, and staff detail) in [`modules/branch/actions/branch-action.ts`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/branch/actions/branch-action.ts).
4. Created client hooks `useBulkAssignStaff`, `useTransferBranchStaff`, and `useBulkTransferStaff` in [`modules/branch/hooks/use-branch.ts`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/branch/hooks/use-branch.ts).
5. Built [`TransferStaffDialog`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/branch/components/transfer-staff-dialog.tsx) enabling 1-click staff transfers from current branch to target branch with role selection.
6. Built [`BulkAssignStaffDialog`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/branch/components/bulk-assign-staff-dialog.tsx) with search, filter, and multi-selection on the branch detail page ([`BranchStaffTab`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/branch/components/branch-staff-tab.tsx)).
7. Built [`StaffBranchCard`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/staff/components/staff-branch-card.tsx) and [`AssignStaffToBranchDialog`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/staff/components/assign-staff-to-branch-dialog.tsx) on [`StaffDetailPage`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/app/admin/(main)/staff/[id]/page.tsx) enabling complete branch management (assign, transfer, unlink) directly from the staff profile.
8. Enhanced [`StaffTable`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/staff/components/staff-table.tsx) and [`staffColumns`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/staff/components/staff-columns.tsx) with multi-row checkboxes, sticky bulk action bar ([`BulkTransferStaffDialog`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/staff/components/bulk-transfer-staff-dialog.tsx) and [`BulkAssignStaffModal`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/staff/components/bulk-assign-staff-modal.tsx)), quick transfer per row, and fixed admin detail URL navigation.
9. Added `getRowId: (row) => row.id` in `useReactTable` to ensure staff IDs (not page-relative array indices `0, 1, ...`) are stored in `rowSelection`, preserving selected staff across pagination transitions.
10. Built `getMatchingStaffIdsAction` and cross-page selection banner in [`StaffTable`](file:///Users/ny/Documents/Code/Okgo/nyenyak-pos/modules/staff/components/staff-table.tsx) allowing users to select all matching staff across all pages in 1 click.
11. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors) and ESLint (0 errors).

**Why:**
Previously, assigning staff to a branch was strictly unidirectional from the branch detail page only, one staff at a time, requiring a cumbersome multi-page deletion and reassignment sequence whenever staff were switched between branches. Furthermore, staff selection on paginated tables mapped to page row indices without unique row IDs, causing selections to shift or break when changing pages.

---

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
