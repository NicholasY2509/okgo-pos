# ADR-0003: Direct Revenue Recognition for Voucher Purchases

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Okgo POS Engineering Team

## Context

Previously, voucher packet purchases booked receipts to liability account `214 Kewajiban Voucher (Unearned Revenue)`. Revenue was deferred and recognized only when vouchers were later redeemed for services (`411 Pendapatan Penjualan`) or when expired (`412 Pendapatan Voucher Kedaluwarsa`). 

The operational business requirement now dictates recognizing voucher sales immediately upon receipt of customer payment as earned revenue rather than holding it in unearned liabilities.

## Decision

We transition voucher purchases from deferred unearned liability to direct revenue recognition:

1. **Voucher Purchase**: When a customer purchases a voucher packet, receipt of tender (Cash `101` / Bank `111`) is credited directly to a dedicated revenue account: **`413 Pendapatan Voucher`** (type: `REVENUE`).
2. **Voucher Redemption**: Because revenue is 100% recognized at purchase, redeeming a voucher at POS does not create secondary revenue or unearned liability debit entries, preventing double counting of income. Only incremental cash/bank paid for non-voucher items is journalized.
3. **Voucher Expiry**: When vouchers pass their validity period, their database status is updated to `EXPIRED` without generating additional breakage journal entries, as revenue was fully recognized at purchase.
4. **Chart of Accounts**: Seed account `413` (`Pendapatan Voucher`, type: `REVENUE`, `isLocked: true`) into the default COA.

## Consequences

### Easier

- Matches immediate cash-basis revenue recognition for business operations.
- Simplifies journal entries on checkout and eliminates unearned revenue liability tracking and reconciliation.
- Prevents double-counting revenue between sale time and service redemption time.

### Harder

- In double-entry accounting, revenue recognition precedes the actual delivery of services.
- Financial reports will show revenue in the period of voucher sale rather than the period of service fulfillment.

## Alternatives considered

### Booking directly to `411 Pendapatan Penjualan`
- Rejected to preserve reporting visibility between treatment service revenue (`411`) and prepaid voucher package sales (`413`).

### Retaining deferred liability `214`
- Rejected per explicit business decision to recognize voucher revenue immediately at the time of purchase.
