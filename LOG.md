# Log

Working context for this repository, newest first. This is a handoff document for the next
session — it records what the code cannot say for itself.

> Maintained under Structure. Append after completing a unit of work.
> Record why, what was rejected, gotchas, and where you stopped — not a diff summary.
> Keep 10 entries verbatim; compact the rest into Consolidated history. Delete lines whose
> value has expired.

## 2026-11-09 — Fingerspot Cloud Developer Integration

**Did:**
1. Documented architecture decisions in [`docs/adr/0005-fingerspot-developer-cloud-integration.md`](docs/adr/0005-fingerspot-developer-cloud-integration.md).
2. Adapted the webhook receiver in [`app/api/attendance/webhook/route.ts`](app/api/attendance/webhook/route.ts):
   - Added support for Fingerspot Cloud real-time punch events (`type === "attlog"`), mapping status scan directions (`0` -> Masuk/Clock-in, `1` -> Pulang/Clock-out) and biometric verification types (Face, Fingerprint, RFID card).
   - Preserved backward compatibility for direct hardware push payloads.
   - Handled asynchronous command callbacks (`get_userinfo`, `get_userid_list`).
3. Implemented a dedicated 5-layer module [`modules/fingerspot/`](modules/fingerspot/):
   - `schemas/fingerspot-schema.ts`: Request/response schemas for device info, attlog queries, and user requests.
   - `repositories/fingerspot-repository.ts`: Clean data access queries for machine lookups and attendance logs.
   - `services/fingerspot-service.ts`: REST API integration with `developer.fingerspot.io` (`/api/get_device`, `/api/get_attlog`, `/api/get_userid_list`, `/api/get_userinfo`).
   - `actions/fingerspot-action.ts`: Server actions for client interactions.
   - `hooks/use-fingerspot.ts`: State management and feedback handling for the test dashboard.
   - `components/fingerspot-dashboard.tsx`: Comprehensive UI featuring live punch log monitoring, on-demand cloud attlog pulling, and user PIN/credential queries.
4. Added the integration page at [`app/admin/(main)/attendance/fingerspot/page.tsx`](app/admin/(main)/attendance/fingerspot/page.tsx) and registered "Fingerspot Cloud" under the Kehadiran sidebar navigation.
5. Ran verification gate: `npm run typecheck` (`tsc --noEmit`) passed with zero errors.

## 2026-11-04 — Marketing Landing Page Maintenance Notice

**Did:**
1. Replaced the public marketing landing page ([`app/(marketing)/page.tsx`](app/(marketing)/page.tsx)) with a dedicated maintenance / system update view in Indonesian:
   - Header with Nyenyak logo (`/logo-long.webp`).
   - "Sedang Dalam Pembaruan" headline with copy: "Kami sedang melakukan peningkatan untuk menghadirkan pengalaman yang lebih baik bagi Anda. Terima kasih atas kesabaran dan pengertian Anda."
   - Quick WhatsApp inquiry link (`https://wa.me/6281234567890`) for urgent guest needs.
   - Clean, lightweight server component layout adhering to DESIGN.md tokens without decorative emojis or heavy client animations.
2. Verified production compilation via `tsc --noEmit` and `next build`.

## 2026-10-26 — Admin Design & Layout Harmonization

**Did:**
1. Standardized Admin Header & Navigation ([`app/admin/(main)/layout.tsx`](app/admin/(main)/layout.tsx)):
   - Replaced static placeholder breadcrumb ("Build Your Application > Data Fetching") with dynamic [`components/admin-breadcrumb.tsx`](components/admin-breadcrumb.tsx) parsing URL paths into localized Indonesian route labels.
   - Standardized main content container (`max-w-[1600px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6`) across the admin portal.
   - Added subtle "Portal Admin" status pill indicator in the header.
2. Standardized PageHeader Primitive ([`components/page-header.tsx`](components/page-header.tsx)):
   - Corrected typography class typos (`space-y-0.5d` -> `space-y-1`, `text-smd` -> `text-sm text-muted-foreground`).
   - Aligned title typography with DESIGN.md standard (`text-2xl md:text-3xl font-bold tracking-tight text-foreground`).
   - Added built-in `backHref` and `backLabel` properties for seamless, consistent back navigation across detail and creation pages.
   - Made header layout responsive (`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`).
3. Revamped Admin Dashboard ([`app/admin/(main)/page.tsx`](app/admin/(main)/page.tsx)):
   - Replaced empty gray aspect-video placeholder boxes with an executive admin command center.
   - Added live KPI cards: Total Pendapatan Sukses, Cabang Aktif / Total Cabang, Layanan & Produk Aktif, and Staf Aktif.
   - Added Cabang Operasional cards with staff count, address, active badge, and manage link.
   - Added Transaksi Terbaru feed with branch name, customer, timestamp, IDR total, and semantic status badge.
4. Revamped Admin Accounting Hub ([`app/admin/(main)/accounting/page.tsx`](app/admin/(main)/accounting/page.tsx)):
   - Replaced hardcoded static mock table (with raw hex/gray classes) with a full Admin Accounting Hub matching DESIGN.md tokens.
   - Added live financial metrics for selected month: Pendapatan, Pengeluaran, Laba Bersih, and Total Jurnal.
   - Added quick navigation cards to Jurnal Umum, Pengeluaran, Bagan Akun (COA), Laporan Keuangan, and Metode Pembayaran.
   - Added live recent journal entries feed across all branches.
5. Harmonized Admin Sub-Pages & Components:
   - Fixed ad-hoc back buttons and wrappers in `branches/[slug]`, `products/[id]`, `customers/[id]`, `salaries`, `staff/onboard`, `payroll/[monthPeriod]`, `accounting/coa/[id]`, and `accounting/journal/[id]`.
   - Unified Dialog nesting and PageHeader structure in [`modules/payment-method/components/payment-method-list.tsx`](modules/payment-method/components/payment-method-list.tsx).
   - Removed debug dumps and raw color classes in [`modules/brand-setting/components/brand-setting-form.tsx`](modules/brand-setting/components/brand-setting-form.tsx).
   - Replaced raw colors (`text-gray-400`, `text-gray-500`, hardcoded amber) with semantic theme tokens.
   - Integrated `PageHeader` into [`modules/pos/components/transaction-history-client.tsx`](modules/pos/components/transaction-history-client.tsx).
   - Normalized admin sidebar navigation URL matching in [`components/app-sidebar.tsx`](components/app-sidebar.tsx) and [`components/nav-main.tsx`](components/nav-main.tsx) to ensure active states highlight accurately whether accessed via `/admin/*` path or subdomain.
6. Verification:
   - Verified clean typecheck (`npm run typecheck`, 0 errors).

**Why:**
The admin portal had significant visual and architectural inconsistencies across pages: placeholder starter templates, hardcoded mock tables, mismatched container padding, missing dynamic breadcrumbs, ad-hoc back buttons, and conflicting dialog wrappers. Standardizing on `PageHeader` and unified layout tokens ensures an executive-grade, consistent user experience.

---

## 2026-10-25 — Month Filtering for Tenant Accounting Module

**Did:**
1. Enhanced and Integrated MonthPicker Component ([`components/ui/month-picker.tsx`](components/ui/month-picker.tsx)):
   - Enhanced existing `MonthPicker` with Indonesian locale month formatting, `className`, `disabled`, and explicit `type="button"` attributes.
   - Built Month Filter Bar ([`modules/accounting/components/accounting-month-filter.tsx`](modules/accounting/components/accounting-month-filter.tsx)) utilizing `MonthPicker` alongside quick previous/next chevrons and a "Bulan Ini" reset button.
   - Synchronized with Next.js router query parameters (`?month=YYYY-MM`).
2. Updated Branch Accounting Hub ([`app/[tenant]/(main)/accounting/page.tsx`](app/[tenant]/(main)/accounting/page.tsx)):
   - Accepted `searchParams` and parsed `month` (defaulting to current month).
   - Filtered Profit & Loss (`ReportService.generateProfitAndLoss`) and Journal Entries (`JournalEntryService.getAllByBranch`) strictly by the selected month's date boundaries (`startOfMonth` to `endOfMonth`).
   - Updated metric cards (Pendapatan, Pengeluaran, Laba Bersih, Total Jurnal) and recent journal activity to reflect the selected month.
   - Forwarded `?month=YYYY-MM` to Jurnal Umum, Pengeluaran, and Laporan Keuangan feature links.
3. Enhanced Journal & Expense Filters ([`modules/accounting/components/journal-filters.tsx`](modules/accounting/components/journal-filters.tsx)):
   - Integrated `MonthPicker` into `JournalFilters` so users can select a month via the 12-month calendar grid or continue using custom date pickers.
   - Updated [`app/[tenant]/(main)/accounting/journal/page.tsx`](app/[tenant]/(main)/accounting/journal/page.tsx) and [`app/[tenant]/(main)/accounting/expenses/page.tsx`](app/[tenant]/(main)/accounting/expenses/page.tsx) to resolve `month` parameter if explicit `startDate`/`endDate` are omitted.
4. Enhanced Financial Reports Date Filter ([`modules/accounting/components/reports/report-date-filter.tsx`](modules/accounting/components/reports/report-date-filter.tsx) and [`app/[tenant]/(main)/accounting/reports/page.tsx`](app/[tenant]/(main)/accounting/reports/page.tsx)):
   - Integrated `MonthPicker` into `ReportDateFilter` for period-based financial reports (Profit & Loss, Trial Balance, Balance Sheet).
   - Resolved `month` parameter in reports route to set date ranges or as-of dates.
5. Verification:
   - Verified clean typecheck (`npm run typecheck`, 0 errors) and test suite (`npm test`, 43 passing tests across 9 test suites).

**Why:**
Branch managers and accountants need to review accounting summaries, profit & loss, expenses, and journal entries on a month-by-month basis, as monthly reporting is the standard financial accounting cadence.

---

## 2026-10-25 — Branch HRIS Module Implementation for Tenant Portals

**Did:**
1. Created Domain Types ([`modules/staff/types/hris-types.ts`](modules/staff/types/hris-types.ts)):
   - Defined `StaffActivityStatus` (`status: "BUSY" | "AVAILABLE" | "OFFLINE"`, `currentSession` with treatment name, room name, customer name, and elapsed/scheduled duration).
   - Defined `StaffTodayAttendance` (clock-in, clock-out, status code, late duration).
   - Defined `StaffAttendanceRecap` (attendance rate %, total days, count of Hadir, Terlambat, Izin/Sakit, and Absen).
   - Defined `BranchStaffHrisItem` and `BranchHrisSummary` data structures.
2. Extended Repository & Service Layers:
   - Added `StaffRepository.getBranchHrisRoster(branchId)` in [`staff-repository.ts`](modules/staff/repositories/staff-repository.ts): queries active staff for the branch with their `workPosition` and `user.role`, loads concurrent `ServiceSession` records (in progress or scheduled for current time) mapped to treatments (`Product`) and `Room` records to determine live busy vs available status, and aggregates today's `AttendanceRecord` alongside 30-day month-to-date attendance metrics.
   - Added `StaffService.getBranchHrisRoster(branchId)` in [`staff-service.ts`](modules/staff/services/staff-service.ts).
   - Added server action `getBranchHrisRosterAction(branchId)` in [`staff-action.ts`](modules/staff/actions/staff-action.ts).
3. Built Branch HRIS Client UI ([`modules/staff/components/branch-hris-client.tsx`](modules/staff/components/branch-hris-client.tsx)):
   - Metric summary cards: Total Karyawan, Sedang Melayani (Sibuk - live pulsating indicator), Tersedia (Standby), and Hadir Hari Ini.
   - Quick filter tabs (Semua, Sedang Sibuk, Tersedia, Hadir Hari Ini) and position dropdown filtering.
   - Staff roster cards with avatar initials, employee ID, role badge, live activity status badge and active session detail (room, service, customer, time), today's clock-in/out badge, and monthly attendance recap percentage pill and breakdown tooltip.
4. Integrated Tenant Portal Routes:
   - Replaced old placeholder page in [`app/[tenant]/(main)/hris/page.tsx`](app/[tenant]/(main)/hris/page.tsx) with branch resolution via `BranchService.getBranchBySubdomain(tenant)` and rendered `BranchHrisClient`.
   - Updated [`app/[tenant]/(main)/hris/attendance/page.tsx`](app/[tenant]/(main)/hris/attendance/page.tsx) to resolve branch by subdomain and provide clear roster navigation.
5. Verification:
   - Verified clean typecheck (`npm run typecheck`, 0 errors) and test suite (`npm test`, 43 passing tests across 9 test suites).

**Why:**
Branch managers and front desk staff need immediate visibility into the branch's employees: who is on shift, what position they hold, their real-time operational availability (whether they are actively in a service session/busy or available), and their current and monthly attendance recap.

---

## 2026-10-25 — Branch Accounting Module Implementation for Tenant Portals

**Did:**
1. Extended [`LedgerAccountRepository`](modules/accounting/repositories/ledger-account-repository.ts), [`LedgerAccountService`](modules/accounting/services/ledger-account-service.ts), and [`getLedgerAccountsWithBalancesAction`](modules/accounting/actions/ledger-account-action.ts):
   - Added optional `branchId` filtering to `findAllWithBalances`.
   - Filtered journal line aggregates using `journalEntry: { branchId }` so Chart of Accounts (COA) balances reflect the specific branch when viewed from a branch portal.
   - Added unit test suite [`ledger-account-service.test.ts`](modules/accounting/services/ledger-account-service.test.ts).
2. Resolved Branch CUID vs Subdomain Routing Bug:
   - Previously, tenant accounting pages passed the subdomain slug (e.g. `'amir-hamzah'`) directly to database queries expecting branch CUIDs (`branchId`), returning 0 records or triggering false 404s in detail checks.
   - Updated [`app/[tenant]/(main)/accounting/journal/page.tsx`](app/[tenant]/(main)/accounting/journal/page.tsx), [`[id]/page.tsx`](app/[tenant]/(main)/accounting/journal/[id]/page.tsx), [`create/page.tsx`](app/[tenant]/(main)/accounting/journal/create/page.tsx), [`expenses/page.tsx`](app/[tenant]/(main)/accounting/expenses/page.tsx), [`expenses/create/page.tsx`](app/[tenant]/(main)/accounting/expenses/create/page.tsx), [`coa/page.tsx`](app/[tenant]/(main)/accounting/coa/page.tsx), [`coa/[id]/page.tsx`](app/[tenant]/(main)/accounting/coa/[id]/page.tsx), and [`reports/page.tsx`](app/[tenant]/(main)/accounting/reports/page.tsx) to resolve `branch = await BranchService.getBranchBySubdomain(tenant)` and use `branch.id` across all repository queries and forms.
3. Created Branch Accounting Hub Page ([`app/[tenant]/(main)/accounting/page.tsx`](app/[tenant]/(main)/accounting/page.tsx)):
   - Replaced old static placeholder table with a comprehensive branch accounting overview.
   - Displays real-time KPI metrics: Pendapatan Hari Ini, Pengeluaran Hari Ini, Laba Bersih Bulan Ini (MTD), and Total Jurnal Terposting.
   - Displays feature navigation cards linking to Jurnal Umum, Pengeluaran, Bagan Akun (COA), and Laporan Keuangan.
   - Displays recent journal transactions table for the branch with quick-view links.
4. Corrected Tenant Subdomain Link Hrefs:
   - Fixed relative link structures across [`journal-columns.tsx`](modules/accounting/components/journal-columns.tsx), [`expense-columns.tsx`](modules/accounting/components/expense-columns.tsx), [`journal-create-form.tsx`](modules/accounting/components/journal-create-form.tsx), and [`expense-create-form.tsx`](modules/accounting/components/expense-create-form.tsx) so non-admin users navigate directly to `/accounting/...` without prepending redundant tenant slugs that produce 404s on subdomains.
5. Enhanced Navigation in [`TenantLayout`](app/[tenant]/(main)/layout.tsx) and [`branchNav`](components/app-sidebar-data.tsx):
   - Added dedicated "Akuntansi" dropdown menu in the top navigation bar with direct links to Ringkasan Akuntansi, Jurnal Umum, Pengeluaran, Bagan Akun (COA), and Laporan Keuangan.
   - Configured `branchNav` in `app-sidebar-data.tsx` to include the complete "Akuntansi" section for branch managers and admins.
6. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors) and `npm test` (43 passing tests across 9 test suites).

**Why:**
The tenant branch portals previously had an incomplete mock accounting page, lacked dedicated accounting navigation, and passed raw subdomain strings to database queries expecting branch CUIDs, preventing branch managers from viewing or recording journals, tracking operational expenses, or inspecting branch-level COA balances.

---

## 2026-10-25 — Branch Filtering on Admin Transactions Page

**Did:**
1. Updated [`TransactionFilterInput`](modules/pos/services/transaction-service.ts) and [`TransactionService.getBranchTransactions`](modules/pos/services/transaction-service.ts):
   - Changed `branchId` to optional in `TransactionFilterInput`.
   - Conditioned `where.branchId` so passing `"all"` or `undefined` queries across all branches.
   - Enriched transactions with `branch` and `branchName` via [`BranchRepository.getBranchesByIds`](modules/branch/repositories/branch-repository.ts).
2. Updated [`useTransactions`](modules/pos/hooks/use-transactions.ts):
   - Added `selectedBranchId` state and `setSelectedBranchId` setter.
   - Handled effective branch fallback (`fixedBranchId ?? (selectedBranchId === "all" ? undefined : selectedBranchId)`).
   - Re-queries debounced when `effectiveBranchId` changes; resets to `fixedBranchId` in `handleResetFilter`.
3. Updated [`TransactionHistoryClient`](modules/pos/components/transaction-history-client.tsx):
   - Added optional `branches?: BranchOption[]` and `isAdmin?: boolean` props.
   - Rendered a branch selector dropdown (`Select`) populated with branches and "Semua Cabang" option.
   - Enabled `showBranch: isAdmin || !branchId` on [`getTransactionHistoryColumns`](modules/pos/components/transaction-history-columns.tsx).
4. Updated [`TransactionDetailDialog`](modules/pos/components/transaction-detail-dialog.tsx):
   - Added branch row in general information section displaying `transaction.branch?.name || transaction.branchName`.
5. Updated [`AdminTransactionsPage`](app/admin/(main)/transactions/page.tsx):
   - Fetched all branches via [`BranchRepository.getAllBranches()`](modules/branch/repositories/branch-repository.ts) and passed them with `isAdmin={true}` to `TransactionHistoryClient`.
6. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors) and `npm test` (41 passing tests).

**Why:**
Administrators need to filter POS transaction history by specific branch or view all branch transactions enterprise-wide, while viewing the branch origin for each transaction in the list and detail dialog.

---

## 2026-10-25 — Branch Filtering on Accounting Journal & Expenses Pages

**Did:**
1. Updated [`JournalFilters`](modules/accounting/components/journal-filters.tsx):
   - Added optional `branches?: BranchFilterOption[]` prop.
   - Rendered a branch selector dropdown (`Select`) populated with branches and "Semua Cabang" fallback.
   - Synchronized branch changes with the URL search params (`branchId`), preserving existing date range selections and resetting `page` to 1.
   - Updated `clearFilters` and filter active indicator to handle `branchId`.
2. Updated [`AdminJournalPage`](app/admin/(main)/accounting/journal/page.tsx):
   - Fetched all active branches via [`BranchRepository.getAllBranches()`](modules/branch/repositories/branch-repository.ts).
   - Passed `branchId` to [`getJournalEntriesAction`](modules/accounting/actions/journal-entry-action.ts).
   - Provided `branches` to [`JournalFilters`](modules/accounting/components/journal-filters.tsx) and `branchId` to [`JournalTable`](modules/accounting/components/journal-table.tsx).
3. Updated [`AdminExpensesPage`](app/admin/(main)/accounting/expenses/page.tsx):
   - Added branch filter support to admin operational expenses view.
4. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors) and `npm test` (41 passing tests).

**Why:**
Administrators need to filter journal entries and expenses by specific branch or view all branches combined across the enterprise.

---

## 2026-10-25 — Resolve Branch Name in Admin Accounting Views

**Did:**
1. Extended [`BranchRepository`](modules/branch/repositories/branch-repository.ts) with `getBranchById` and `getBranchesByIds` methods to query branch details (`id`, `name`, `subdomain`).
2. Updated [`JournalEntryService`](modules/accounting/services/journal-entry-service.ts):
   - Added `enrichWithBranches` helper that batch-fetches branch metadata for unique `branchId`s via `BranchRepository.getBranchesByIds`.
   - Enriched journal results in `getAllByBranch`, `getById`, `getByAccountId`, and `getExpenseEntries` with `branch` object and `branchName`.
3. Updated UI columns and pages:
   - [`modules/accounting/components/journal-columns.tsx`](modules/accounting/components/journal-columns.tsx): replaced raw `entry.branchId` monospace label with `{entry.branch?.name || entry.branchName || entry.branchId}`.
   - [`modules/accounting/components/expense-columns.tsx`](modules/accounting/components/expense-columns.tsx): replaced raw `entry.branchId` monospace label with `{entry.branch?.name || entry.branchName || entry.branchId}`.
   - [`app/admin/(main)/accounting/journal/[id]/page.tsx`](app/admin/(main)/accounting/journal/[id]/page.tsx): displayed `{entry.branch?.name || entry.branchName || entry.branchId}` in journal detail view.
4. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors) and `npm test` (41 passing tests).

**Why:**
The admin journal and expense lists displayed raw database CUID identifiers (e.g. `Cabang: cms03m2t1000201mdzbfxsdso`) instead of human-readable branch names (e.g. `Cabang: Juanda`). Resolving the branch relations at the service layer and displaying the branch names improves usability and readability for administrators.

---

## 2026-10-25 — Transaction Cancellation (2-Day Window) & Accounting Reversal

**Did:**
1. Extended [`JournalEntryAutomation`](modules/accounting/services/journal-entry-automation.ts) with `handleTransactionCancelled`:
   - Queries original sales journal entries matching the transaction number (`Penjualan POS #${transaction.transactionNumber}`).
   - Generates a symmetrical reversal journal entry (`Reversal / Pembatalan Penjualan POS #${transaction.transactionNumber}`) swapping debits and credits on account codes to bring net ledger balances back to zero without deleting historical entries.
   - Added unit test suite in [`journal-entry-automation.test.ts`](modules/accounting/services/journal-entry-automation.test.ts).
2. Updated [`PosTransactionRepository.cancelTransaction`](modules/pos/repositories/pos-transaction-repository.ts):
   - Enforced 2-day (48-hour) cancellation cutoff (`diffInMs > 2 * 24 * 60 * 60 * 1000`).
   - Marks transaction and all linked service sessions as `CANCELLED`.
   - If originated from a booking, marks parent `Booking` as `CANCELLED`.
   - Enforced strict voucher packet rule: a voucher packet purchase transaction can ONLY be cancelled if **every single voucher inside has not been used** (100% untouched balance, 0 redemptions, active status). If any voucher was redeemed (e.g. 1 out of 12), cancellation is blocked with a detailed error. If all are untouched, all generated vouchers are voided (`VOID`).
   - Restores any vouchers that were redeemed *by* this transaction.
   - Deletes linked staff incentives (`StaffIncentive`).
   - Triggers `JournalEntryAutomation.handleTransactionCancelled(tx, transaction)`.
   - Added unit test suite in [`pos-transaction-repository.test.ts`](modules/pos/repositories/pos-transaction-repository.test.ts).
3. Created server action [`cancelTransactionAction`](modules/pos/actions/transaction-action.ts) with `AuthGuardService.requireAuth()` check.
4. Updated [`TransactionDetailDialog`](modules/pos/components/transaction-detail-dialog.tsx) and [`transaction-history-columns.tsx`](modules/pos/components/transaction-history-columns.tsx):
   - Added `Batalkan Transaksi` trigger with confirmation [`AlertDialog`](components/ui/alert-dialog.tsx) outlining consequences.
   - Automatically disables cancellation for transactions older than 2 days or already cancelled, displaying an informative notice.
   - Wired `onTransactionCancelled` to refresh table and summary metrics in [`TransactionHistoryClient`](modules/pos/components/transaction-history-client.tsx).
   - Filtered out `CANCELLED` and `VOIDED` transactions from sales and count aggregates in [`TransactionRepository.aggregateSums`](modules/pos/repositories/transaction-repository.ts) and [`TransactionService.getBranchTransactions`](modules/pos/services/transaction-service.ts).
5. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors) and `npm test` (37 passing tests).

**Why:**
Transactions needed a secure mechanism to be cancelled within 48 hours while guaranteeing double-entry accounting integrity, voucher balance restorations, session cancellations, and commission cleanups.

---

## 2026-10-25 — Cashier Assignment on Booking Settlement & Online Booking Indicator

**Did:**
1. Updated [`payExistingTransactionAction`](modules/pos/actions/pos-action.ts) to resolve the active cashier's session via `auth()` and `StaffUserService.findByUserId`, passing `cashierId` into the service.
2. Updated [`PosPaymentService.payExistingTransaction`](modules/pos/services/pos-payment-service.ts) and [`PosPaymentRepository.payExistingTransaction`](modules/pos/repositories/pos-payment-repository.ts) to accept `cashierId` and persist it to `transaction.cashierId` upon payment settlement.
3. Updated [`TransactionService.getBranchTransactions`](modules/pos/services/transaction-service.ts) to detect booking transactions (`i.serviceSessions.some(s => s.bookingId)`) where `cashierId` is null, defaulting the cashier representation to `"Booking Online"` instead of leaving it empty/blank.
4. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors) and `npm test` (35 passing tests).

**Why:**
Transactions originating from online customer bookings are initialized with `cashierId: null`. When paid at the branch through the existing transaction payment modal, the cashier was previously never captured. This change ensures that settlements record the cashier on duty, while pending or historical booking transactions clearly indicate `"Booking Online"`.

---

## 2026-10-25 — Real-time Branch Notification for Marketing Bookings

**Did:**
1. Fixed WebSocket multi-tenant room isolation for branch notifications by subscribing to `join_branch` in [`GlobalNotificationListener`](components/global-notification-listener.tsx) and [`TimetableClient`](modules/pos/components/timetable-client.tsx).
2. Ensured reconnection stability with `socket.on("connect", joinBranchRoom)` so client re-joins its designated branch room upon network or server reconnects.
3. Removed unused legacy imports in [`PosClient`](modules/pos/components/pos-client.tsx).
4. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors).

**Why:**
`socket-server.js` was updated previously to emit `new_booking` events to room-specific channels (`io.to(String(branchId))`). However, client-side listeners never called `socket.emit("join_branch", branchId)`, causing `io.to(branchId)` broadcasts from the marketing booking flow to be dropped on an empty room.

---

## 2026-10-25 — Resolve Cashier Name in Transaction Detail Dialog

**Did:**
1. Extended [`TransactionRepository`](modules/pos/repositories/transaction-repository.ts) with `findCashiersByIds` (querying `prisma.staff`) and `findUsersByIds` (querying `prisma.user` fallback).
2. Updated [`TransactionService.getBranchTransactions`](modules/pos/services/transaction-service.ts) to batch resolve `cashierId` values against staff/user profiles, mapping full names and attaching `cashier` and `cashierName` to serialized transaction objects.
3. Updated [`TransactionDetailDialog`](modules/pos/components/transaction-detail-dialog.tsx) to display `transaction.cashier?.name || transaction.cashierName || transaction.cashierId || "-"` instead of showing the raw CUID cashier ID.
4. Verified with `npm run typecheck` (`tsc --noEmit`, 0 errors) and `npm test` (35 passing tests).

**Why:**
Transactions store `cashierId` (pointing to staff ID). Previously, the detail modal directly rendered `transaction.cashierId` (e.g. `cms044kq6000801mdni64vcek`), which was confusing for branch managers and staff reviewing transaction history.

---

## 2026-10-25 — Unified Kiosk & Reviews Exit Flow & Fullscreen Splash

**Did:**
1. Unified credential requirements for exiting Kiosk (`/kiosk`) and Reviews (`/reviews`) pages on tenant branch portals.
2. Updated [`kioskExitSchema`](modules/auth/schemas/kiosk-schema.ts) to validate `email` and `password` with localized validation messages and optional `subdomain`.
3. Added server action [`exitToPosAction`](modules/auth/actions/kiosk-action.ts) that verifies staff/manager credentials against [`AuthService.verifyCredentials`](modules/auth/services/auth-service.ts), purges `staff_session` cookie, calls `signIn("credentials")`, and redirects to `/pos`.
4. Created client hook [`useExitToPos`](modules/auth/hooks/use-exit-to-pos.ts) to manage form state, error surfacing, toast notifications, fullscreen exit cleanup, and redirect to `/pos`.
5. Updated [`KioskExitModal`](modules/auth/components/kiosk-exit-modal.tsx) to consume `useExitToPos` and adhere to design tokens (`text-destructive`, `rounded-2xl`).
6. Updated [`ExitReviewsModal`](modules/service-session/components/exit-reviews-modal.tsx) to replace the staff PIN keypad with standard email and password authentication, consuming `useExitToPos` and redirecting to `/pos`.
7. Created [`FullscreenSplash`](components/fullscreen-splash.tsx) with branded ambient backdrop, animated loading state, and fullscreen trigger to hide browser address bar and prevent manual URL retyping on kiosk and review devices.
8. Added persistent floating restore button in `FullscreenSplash` if fullscreen is exited while on kiosk or review modes.
9. Integrated `FullscreenSplash` into [`KioskLayout`](app/[tenant]/kiosk/layout.tsx) and [`CustomerReviewPage`](app/[tenant]/reviews/page.tsx).
10. Created comprehensive unit test suite [`kiosk-action.test.ts`](modules/auth/actions/kiosk-action.test.ts) covering validation, invalid credentials, branch access guards, session cookie cleanup, and redirect behavior.
11. Fixed 404 error on "Log Out Kiosk" button and session guards in [`KioskDashboardPage`](app/[tenant]/kiosk/dashboard/page.tsx) where `redirect('/${resolvedParams.tenant}/kiosk')` caused double-subdomain URL rewrites (`/juanda/juanda/kiosk`), replacing it with standard tenant route `redirect('/kiosk')`.
12. Added prominent Exit Kiosk controls:
    - Fixed top-left pill button (`fixed top-6 left-6 z-20`) and in-card action on [`KioskPage`](app/[tenant]/kiosk/page.tsx) to exit to `/pos` with email and password credentials.
13. Enforced persistent fullscreen lock on [`FullscreenSplash`](components/fullscreen-splash.tsx) using modern Keyboard Lock API (`navigator.keyboard.lock(['Escape'])`), global keydown event suppression for Escape/F11, and automatic full-screen overlay lock whenever the browser exits fullscreen mode.
14. Ensured automatic exit from fullscreen mode when returning to POS via proactive user-gesture exit in [`useExitToPos`](modules/auth/hooks/use-exit-to-pos.ts) and mounted [`EnsureWindowedMode`](components/ensure-windowed-mode.tsx) in [`TenantLayout`](app/[tenant]/(main)/layout.tsx).
15. Verified with `npm test` (7 test files, 35 tests pass) and `npm run typecheck` (`tsc --noEmit`, 0 errors).

**Why:**
Previously, exiting reviews required staff username and PIN (with a custom numpad) while kiosk exit required manager email and password, and redirection paths were inconsistent (`/${tenantSlug}/pos` causing 404s on subdomains vs `/pos`). Additionally, leaving browser address bars exposed on tablet devices allowed unauthorized navigation/URL retyping; the new splash screen activates native fullscreen to lock out browser navigation until authorized exit back to POS.

---

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
