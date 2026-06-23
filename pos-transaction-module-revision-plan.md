# POS Transaction Module Revision Plan

This document describes the required changes to the proposed POS Transaction Module plan.

The goal is to make the POS architecture scalable for:

- Service sales
- Voucher/package sales
- Voucher/package redemption
- Multiple payment methods
- Split payments
- Refund/cancel handling
- Service sessions with therapist and room assignment
- Multi-branch reporting

---

## Summary of Required Changes

The current plan is mostly correct, but several parts must be adjusted before implementation.

### Must Change

1. Remove `paymentMethodId` from `Transaction`.
2. Add a separate `TransactionPayment` model.
3. Update `CustomerVoucher` to support package balances, not only single-use vouchers.
4. Add a `VoucherRedemption` model.
5. Add snapshot fields to `TransactionItem`.
6. Use `serviceId` instead of `productId`, unless the project has a unified product/catalog model.
7. Make POS checkout use `prisma.$transaction`.
8. Add cancel/refund/voucher-restore logic.
9. Make service session creation handle quantity correctly.
10. Validate branch, room, staff, customer, voucher, and payment rules.

---

# 1. Prisma Schema Changes

## 1.1 Transaction Model

### Current Problem

The proposed `Transaction` model contains:

```prisma
paymentMethodId
```

This is not flexible enough because a single transaction may be paid using multiple methods.

Examples:

- Cash + QRIS
- Voucher + Cash
- EDC + Transfer
- Partial payment
- Refund handling

### Required Change

Remove `paymentMethodId` from `Transaction`.

Add total fields and connect payments through `TransactionPayment`.

### Recommended Fields

```prisma
model Transaction {
  id                String              @id @default(cuid())

  tenantId          String?
  branchId          String
  customerId        String?
  cashierId         String?

  transactionNumber String              @unique

  subtotal          Decimal             @db.Decimal(12, 2)
  discountTotal     Decimal             @default(0) @db.Decimal(12, 2)
  taxTotal          Decimal             @default(0) @db.Decimal(12, 2)
  totalAmount       Decimal             @db.Decimal(12, 2)
  paidAmount        Decimal             @default(0) @db.Decimal(12, 2)
  changeAmount      Decimal             @default(0) @db.Decimal(12, 2)

  status            TransactionStatus   @default(PENDING)

  customer          Customer?           @relation(fields: [customerId], references: [id])
  items             TransactionItem[]
  payments          TransactionPayment[]

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([branchId])
  @@index([customerId])
  @@index([createdAt])
}
```

### Recommended Enum

```prisma
enum TransactionStatus {
  PENDING
  COMPLETED
  CANCELLED
  VOIDED
  REFUNDED
  PARTIAL_REFUND
}
```

---

## 1.2 TransactionPayment Model

### Required New Model

Add this model to support multiple payments per transaction.

```prisma
model TransactionPayment {
  id              String        @id @default(cuid())

  transactionId   String
  paymentMethodId String

  amount          Decimal       @db.Decimal(12, 2)
  referenceNumber String?
  notes           String?

  transaction     Transaction   @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  paymentMethod   PaymentMethod @relation(fields: [paymentMethodId], references: [id])

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([transactionId])
  @@index([paymentMethodId])
}
```

---

## 1.3 PaymentMethod Model

### Recommended Model

```prisma
model PaymentMethod {
  id          String              @id @default(cuid())

  name        String
  type        PaymentMethodType
  isActive    Boolean             @default(true)

  payments    TransactionPayment[]

  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}
```

### Recommended Enum

```prisma
enum PaymentMethodType {
  CASH
  EDC
  QRIS
  TRANSFER
  VOUCHER
}
```

---

## 1.4 TransactionItem Model

### Current Problem

The current plan uses:

```prisma
productId
voucherPacketId
price
quantity
```

This is not enough for historical receipts.

If the service price changes later, old receipts must not change.

### Required Changes

Add snapshot fields:

- `itemNameSnapshot`
- `unitPrice`
- `discountAmount`
- `subtotal`

Use `serviceId` instead of `productId`, unless the system already has a unified product/catalog model.

### Recommended Model

```prisma
model TransactionItem {
  id                String              @id @default(cuid())

  transactionId     String
  type              TransactionItemType

  serviceId         String?
  voucherPacketId   String?

  itemNameSnapshot  String
  unitPrice         Decimal             @db.Decimal(12, 2)
  quantity          Int                 @default(1)
  discountAmount    Decimal             @default(0) @db.Decimal(12, 2)
  subtotal          Decimal             @db.Decimal(12, 2)

  transaction       Transaction         @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  serviceSessions   ServiceSession[]
  voucherRedemptions VoucherRedemption[]

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([transactionId])
  @@index([serviceId])
  @@index([voucherPacketId])
}
```

### Recommended Enum

```prisma
enum TransactionItemType {
  SERVICE
  VOUCHER_PACKET
}
```

### Important Rule

For services, prefer one service session per item.

Recommended behavior:

```txt
1 service session = 1 transaction item with quantity 1
```

If quantity is greater than 1 for services, the system must create one `ServiceSession` per quantity.

---

## 1.5 VoucherPacket Model Updates

The current plan adds:

```prisma
codeSuffix
```

This is acceptable.

However, the packet also needs to define what kind of package it is.

### Recommended Fields

```prisma
model VoucherPacket {
  id                  String             @id @default(cuid())

  name                String
  codeSuffix          String?

  price               Decimal            @db.Decimal(12, 2)

  totalVisitCount     Int?
  totalCreditAmount   Decimal?           @db.Decimal(12, 2)

  validityDays        Int?
  isActive            Boolean            @default(true)

  customerVouchers    CustomerVoucher[]

  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
}
```

### Notes

Support two voucher/package types:

#### Visit-based package

Example:

```txt
10x Massage Package
totalVisitCount = 10
totalCreditAmount = null
```

#### Credit-based package

Example:

```txt
Rp 1,000,000 Spa Credit
totalVisitCount = null
totalCreditAmount = 1000000
```

At least one of these must be set:

```txt
totalVisitCount OR totalCreditAmount
```

---

## 1.6 CustomerVoucher Model

### Current Problem

The current model only supports:

```txt
AVAILABLE
REDEEMED
EXPIRED
```

This only works for single-use vouchers.

It does not properly support packages like:

```txt
10x Massage Package
```

### Required Change

Use a balance-based voucher model.

### Recommended Model

```prisma
model CustomerVoucher {
  id                        String                @id @default(cuid())

  code                      String                @unique

  customerId                String
  voucherPacketId           String

  sourceTransactionId       String?
  sourceTransactionItemId   String?

  initialVisitCount         Int?
  remainingVisitCount       Int?

  initialCreditAmount       Decimal?              @db.Decimal(12, 2)
  remainingCreditAmount     Decimal?              @db.Decimal(12, 2)

  status                    CustomerVoucherStatus @default(ACTIVE)
  expiresAt                 DateTime?

  customer                  Customer              @relation(fields: [customerId], references: [id])
  voucherPacket             VoucherPacket         @relation(fields: [voucherPacketId], references: [id])

  redemptions               VoucherRedemption[]

  createdAt                 DateTime              @default(now())
  updatedAt                 DateTime              @updatedAt

  @@index([customerId])
  @@index([voucherPacketId])
  @@index([status])
  @@index([expiresAt])
}
```

### Recommended Enum

```prisma
enum CustomerVoucherStatus {
  ACTIVE
  USED_UP
  EXPIRED
  VOID
}
```

---

## 1.7 VoucherRedemption Model

### Required New Model

Every voucher usage must be recorded.

Do not only update the remaining balance.

### Recommended Model

```prisma
model VoucherRedemption {
  id                  String            @id @default(cuid())

  customerVoucherId   String
  transactionId       String
  transactionItemId   String?
  serviceSessionId    String?

  redeemedVisitCount  Int?
  redeemedAmount      Decimal?          @db.Decimal(12, 2)

  redeemedAt          DateTime          @default(now())

  customerVoucher     CustomerVoucher   @relation(fields: [customerVoucherId], references: [id])
  transaction         Transaction       @relation(fields: [transactionId], references: [id])
  transactionItem     TransactionItem?  @relation(fields: [transactionItemId], references: [id])
  serviceSession      ServiceSession?   @relation(fields: [serviceSessionId], references: [id])

  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  @@index([customerVoucherId])
  @@index([transactionId])
  @@index([transactionItemId])
  @@index([serviceSessionId])
}
```

### Purpose

This table allows the system to answer:

- When was the voucher used?
- Which transaction redeemed it?
- Which service consumed it?
- Which therapist handled it?
- Which branch redeemed it?
- Was the usage later cancelled or refunded?

---

## 1.8 ServiceSession Model

### Current Plan Is Good

The proposed `ServiceSession` model is a good idea.

It should stay separate from `TransactionItem`.

### Recommended Additions

Add:

- `customerId`
- `serviceId`
- `branchId`

Even though these can be derived through relations, storing them directly makes filtering and reports easier.

### Recommended Model

```prisma
model ServiceSession {
  id                String               @id @default(cuid())

  transactionItemId String
  customerId        String?
  serviceId         String
  staffId           String
  roomId            String
  branchId          String

  status            ServiceSessionStatus @default(SCHEDULED)

  startTime         DateTime?
  endTime           DateTime?

  transactionItem   TransactionItem      @relation(fields: [transactionItemId], references: [id], onDelete: Cascade)
  voucherRedemptions VoucherRedemption[]

  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt

  @@index([transactionItemId])
  @@index([customerId])
  @@index([serviceId])
  @@index([staffId])
  @@index([roomId])
  @@index([branchId])
  @@index([status])
}
```

### Recommended Enum

```prisma
enum ServiceSessionStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

---

## 1.9 Customer Model

The proposed model is acceptable.

Recommended minimum:

```prisma
model Customer {
  id              String             @id @default(cuid())

  name            String
  phone           String?
  email           String?

  vouchers        CustomerVoucher[]
  transactions    Transaction[]

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@index([phone])
  @@index([email])
}
```

Optional improvements:

- Add `branchId` if customers are branch-specific.
- Add `tenantId` if the app is multi-tenant.
- Add unique phone per tenant if phone is the main identifier.

---

# 2. POS Service Logic Changes

File:

```txt
modules/pos/services/pos-service.ts
```

## 2.1 Use Prisma Transaction

All checkout logic must run inside:

```ts
await prisma.$transaction(async (tx) => {
  // checkout logic here
});
```

This prevents partial writes.

### Required Atomic Flow

Inside the Prisma transaction:

1. Validate request.
2. Validate branch.
3. Validate customer, if provided.
4. Validate cart items.
5. Validate payment methods.
6. Validate voucher code, if voucher payment is used.
7. Calculate subtotal, discount, tax, total.
8. Calculate paid amount and change.
9. Create `Transaction`.
10. Create `TransactionItem` records.
11. Create `TransactionPayment` records.
12. Create `CustomerVoucher` records if voucher packets were sold.
13. Create `ServiceSession` records if services were sold.
14. Create `VoucherRedemption` records if voucher payment was used.
15. Update `CustomerVoucher` remaining balance.
16. Mark transaction as `COMPLETED`.

---

## 2.2 Selling a Service

When selling a service:

1. Create `TransactionItem` with `type = SERVICE`.
2. Store service snapshot fields.
3. Create `ServiceSession`.
4. Assign:
   - `staffId`
   - `roomId`
   - `branchId`
   - `customerId`
   - `serviceId`

### Rule

Room must belong to the same branch as the transaction.

```txt
room.branchId === transaction.branchId
```

### Staff Rule

If staff are branch-specific, validate that staff can work in the selected branch.

If staff can work across branches, still store the transaction branch in `ServiceSession.branchId`.

---

## 2.3 Selling a Voucher Packet

When selling a voucher packet:

1. Create `TransactionItem` with `type = VOUCHER_PACKET`.
2. Store voucher packet snapshot fields.
3. After successful payment, create `CustomerVoucher`.

### Voucher Code Generation

Use `codeSuffix` if available.

Example:

```txt
[RANDOM_HEX]-[SUFFIX]
```

Required behavior:

- Code must be globally unique.
- Retry generation if a duplicate code occurs.
- Save the source transaction and transaction item.

Recommended generated format:

```txt
VCH-[YYYYMMDD]-[RANDOM_HEX]-[SUFFIX]
```

Example:

```txt
VCH-20260621-A91F3D-MSG
```

### Voucher Expiration

If `validityDays` exists:

```ts
expiresAt = transactionDate + validityDays
```

If no validity is set:

```txt
expiresAt = null
```

---

## 2.4 Paying with Voucher

When customer pays using a voucher:

1. Validate voucher exists.
2. Validate voucher belongs to the selected customer.
3. Validate voucher status is `ACTIVE`.
4. Validate voucher is not expired.
5. Validate remaining balance is enough.
6. Create `TransactionPayment` with payment method type `VOUCHER`.
7. Create `VoucherRedemption`.
8. Decrease remaining balance.
9. If remaining balance reaches zero, set status to `USED_UP`.

### Visit-based Voucher

For visit-based vouchers:

```txt
remainingVisitCount must be greater than 0
```

After redemption:

```txt
remainingVisitCount = remainingVisitCount - redeemedVisitCount
```

Usually:

```txt
redeemedVisitCount = 1
```

### Credit-based Voucher

For amount-based vouchers:

```txt
remainingCreditAmount must be >= redeemedAmount
```

After redemption:

```txt
remainingCreditAmount = remainingCreditAmount - redeemedAmount
```

---

## 2.5 Split Payment Support

The request schema should allow multiple payments.

Example request:

```ts
payments: [
  {
    paymentMethodId: "cash-id",
    amount: 50000
  },
  {
    paymentMethodId: "qris-id",
    amount: 200000,
    referenceNumber: "QRIS-REF-001"
  }
]
```

For voucher + cash:

```ts
payments: [
  {
    paymentMethodId: "voucher-payment-method-id",
    amount: 250000,
    voucherCode: "VCH-20260621-A91F3D-MSG"
  },
  {
    paymentMethodId: "cash-id",
    amount: 50000
  }
]
```

Validation:

```txt
sum(payments.amount) >= transaction.totalAmount
```

If overpaid by cash:

```txt
changeAmount = paidAmount - totalAmount
```

If overpaid by non-cash methods, decide whether to reject or allow based on business rules.

Recommended:

```txt
Only CASH may produce change.
```

---

# 3. POS Zod Schema Changes

File:

```txt
modules/pos/schemas/pos-schema.ts
```

## Required Shape

The POS request should support:

- Branch
- Customer
- Cart items
- Service session data
- Multiple payments
- Voucher code validation

### Example Shape

```ts
const posCheckoutSchema = z.object({
  branchId: z.string().min(1),
  customerId: z.string().optional(),

  items: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("SERVICE"),
        serviceId: z.string().min(1),
        quantity: z.number().int().min(1).default(1),
        staffId: z.string().min(1),
        roomId: z.string().min(1),
        discountAmount: z.number().nonnegative().default(0),
      }),

      z.object({
        type: z.literal("VOUCHER_PACKET"),
        voucherPacketId: z.string().min(1),
        quantity: z.number().int().min(1).default(1),
        discountAmount: z.number().nonnegative().default(0),
      }),
    ])
  ).min(1),

  payments: z.array(
    z.object({
      paymentMethodId: z.string().min(1),
      amount: z.number().positive(),
      referenceNumber: z.string().optional(),
      voucherCode: z.string().optional(),
    })
  ).min(1),
});
```

### Additional Validation Rules

After basic Zod validation, service logic must validate:

- Payment method exists and is active.
- If payment type is `VOUCHER`, `voucherCode` is required.
- If payment type is not `VOUCHER`, `voucherCode` must be ignored or rejected.
- Service exists and is active.
- Voucher packet exists and is active.
- Room exists and belongs to selected branch.
- Staff exists and can serve the selected service/branch.
- Customer is required when buying a voucher packet.
- Customer is required when paying by voucher.
- Voucher belongs to the selected customer.
- Voucher is active and not expired.

---

# 4. POS UI Changes

## 4.1 Payment Modal

File:

```txt
modules/pos/components/payment-modal.tsx
```

Required changes:

- Allow selecting multiple payment methods.
- Support voucher code input when selected payment method type is `VOUCHER`.
- Show total amount.
- Show paid amount.
- Show remaining amount.
- Show change amount.
- Validate that payment amount is enough before submitting.

### UI Example

```txt
Total: Rp 300.000

Payment 1:
- Method: Voucher
- Code: VCH-20260621-A91F3D-MSG
- Amount: Rp 250.000

Payment 2:
- Method: Cash
- Amount: Rp 50.000

Paid: Rp 300.000
Remaining: Rp 0
Change: Rp 0
```

---

## 4.2 POS Cart

File:

```txt
modules/pos/components/pos-cart.tsx
```

Required changes:

- Service cart item must include:
  - service
  - therapist/staff
  - room
  - price
  - discount
  - subtotal

- Voucher packet cart item must include:
  - voucher packet
  - price
  - quantity
  - discount
  - subtotal

Important:

For services, either:

1. Force quantity to 1, or
2. Generate one service session per quantity.

Recommended:

```txt
Force service quantity to 1.
```

This keeps therapist/room assignment simpler.

---

## 4.3 Customer Selection

Customer must be required when:

- Buying voucher packet
- Paying with voucher

Customer can be optional when:

- Paying cash/QRIS/EDC for normal service

The UI should allow:

- Search existing customer
- Create new customer quickly
- Attach selected customer to transaction

---

# 5. Master Pages

## 5.1 Payment Method Master

Route:

```txt
app/admin/settings/payment-methods
```

Required fields:

- name
- type
- isActive

Validation:

- name required
- type required
- type must be one of:
  - CASH
  - EDC
  - QRIS
  - TRANSFER
  - VOUCHER

Recommended default methods:

```txt
Cash
BCA EDC
Mandiri EDC
QRIS
Bank Transfer
Voucher
```

---

## 5.2 Customer Master

Route:

```txt
app/admin/customers
```

Required features:

- List customers
- Search by name
- Search by phone
- Create customer
- Edit customer
- View customer voucher balance
- View customer transaction history

---

## 5.3 Voucher Packet Master

Route:

```txt
modules/vouchers
```

Required updates:

- Add `codeSuffix`
- Add `totalVisitCount`
- Add `totalCreditAmount`
- Add `validityDays`

Validation:

- name required
- price required
- either `totalVisitCount` or `totalCreditAmount` must be provided
- `totalVisitCount` must be positive if provided
- `totalCreditAmount` must be positive if provided
- `validityDays` must be positive if provided
- `codeSuffix` should be short and uppercase if used

---

# 6. Cancel / Refund Rules

The current plan does not mention cancel/refund logic.

This must be included.

## 6.1 Cancel Service Transaction Paid by Cash/QRIS/EDC

When cancelling:

1. Set transaction status to `VOIDED` or `CANCELLED`.
2. Set related service sessions to `CANCELLED`.
3. Do not delete the transaction.

---

## 6.2 Cancel Transaction That Generated Voucher

If a voucher packet sale is cancelled:

1. Set transaction status to `VOIDED`.
2. Set generated `CustomerVoucher` status to `VOID`.
3. Do not allow cancellation if voucher has already been partially or fully redeemed, unless refund rules are explicitly handled.

---

## 6.3 Cancel Service Paid by Voucher

If service paid by voucher is cancelled:

1. Set transaction status to `VOIDED`.
2. Set service session status to `CANCELLED`.
3. Reverse the voucher redemption.
4. Restore voucher remaining balance.
5. Mark voucher back to `ACTIVE` if it was `USED_UP`.

Recommended approach:

- Keep the original `VoucherRedemption` row.
- Add a reversal record or nullable `voidedAt`/`voidReason`.

Optional enhanced model fields:

```prisma
voidedAt     DateTime?
voidReason   String?
```

---

# 7. Reports Supported by This Design

This design should support these reports:

## Daily Sales

```sql
SELECT
  DATE(created_at) AS date,
  SUM(total_amount) AS total_sales
FROM transactions
WHERE status = 'COMPLETED'
GROUP BY DATE(created_at);
```

## Sales by Item Type

```sql
SELECT
  type,
  SUM(subtotal) AS total
FROM transaction_items
GROUP BY type;
```

## Sales by Payment Method

```sql
SELECT
  pm.name,
  SUM(tp.amount) AS total
FROM transaction_payments tp
JOIN payment_methods pm ON pm.id = tp.payment_method_id
GROUP BY pm.name;
```

## Voucher Balance by Customer

```sql
SELECT
  customer_id,
  code,
  remaining_visit_count,
  remaining_credit_amount,
  status
FROM customer_vouchers;
```

## Therapist Service History

```sql
SELECT
  staff_id,
  COUNT(*) AS total_sessions
FROM service_sessions
WHERE status = 'COMPLETED'
GROUP BY staff_id;
```

---

# 8. Updated Verification Plan

The implementation must be tested with these cases.

## Master Data Tests

- Create customer.
- Edit customer.
- Create payment method.
- Deactivate payment method.
- Create voucher packet with visit count.
- Create voucher packet with credit amount.
- Create voucher packet with code suffix.

## POS Transaction Tests

### Service Sales

- Sell service with cash.
- Sell service with QRIS.
- Sell service with EDC.
- Sell service with split payment.
- Verify transaction is created.
- Verify transaction item is created.
- Verify transaction payment is created.
- Verify service session is created.

### Voucher Packet Sales

- Sell voucher packet to existing customer.
- Sell voucher packet to new customer.
- Verify customer voucher is generated.
- Verify voucher code is unique.
- Verify voucher expiry date is correct.
- Verify source transaction is linked.

### Voucher Redemption

- Redeem visit-based voucher once.
- Verify remaining visit count decreases.
- Redeem credit-based voucher.
- Verify remaining credit decreases.
- Redeem until balance reaches zero.
- Verify voucher status changes to `USED_UP`.
- Try redeeming used-up voucher.
- Try redeeming expired voucher.
- Try redeeming voucher owned by another customer.

### Cancel / Refund

- Cancel cash service transaction.
- Cancel voucher-paid service transaction.
- Verify voucher balance is restored.
- Cancel voucher packet sale before redemption.
- Verify generated voucher becomes `VOID`.
- Try cancelling voucher packet sale after redemption.
- Verify system prevents it or handles refund explicitly.

### Branch / Room / Staff Validation

- Try assigning room from different branch.
- Verify system rejects it.
- Try assigning inactive staff.
- Verify system rejects it.
- Try assigning inactive service.
- Verify system rejects it.

---

# 9. Final Implementation Checklist

## Prisma

- [ ] Remove `paymentMethodId` from `Transaction`.
- [ ] Add `TransactionPayment`.
- [ ] Add `VoucherRedemption`.
- [ ] Update `CustomerVoucher`.
- [ ] Update `TransactionItem`.
- [ ] Update `VoucherPacket`.
- [ ] Update `ServiceSession`.
- [ ] Add required enums.
- [ ] Add indexes.
- [ ] Generate Prisma Client.
- [ ] Run migration.

## Backend / Server Actions

- [ ] Update POS Zod schema.
- [ ] Update POS checkout action.
- [ ] Implement `prisma.$transaction` checkout flow.
- [ ] Implement transaction number generation.
- [ ] Implement voucher code generation.
- [ ] Implement voucher validation.
- [ ] Implement voucher redemption.
- [ ] Implement service session creation.
- [ ] Implement split payment.
- [ ] Implement cancel/void logic.
- [ ] Implement voucher reversal logic.

## Frontend

- [ ] Update POS cart.
- [ ] Update payment modal for multiple payments.
- [ ] Add voucher code input.
- [ ] Add customer selection.
- [ ] Add quick-create customer flow.
- [ ] Add payment summary.
- [ ] Show paid amount, remaining amount, and change amount.

## Master Pages

- [ ] Create Payment Method master page.
- [ ] Create Customer master page.
- [ ] Update Voucher Packet form.
- [ ] Add voucher balance view to customer detail.

## Testing

- [ ] Test service cash sale.
- [ ] Test service QRIS sale.
- [ ] Test voucher packet sale.
- [ ] Test voucher redemption.
- [ ] Test split payment.
- [ ] Test cancel service.
- [ ] Test cancel voucher packet sale.
- [ ] Test voucher restore after cancelled service.
- [ ] Test branch-room validation.
- [ ] Test inactive master data validation.

---

# 10. Approval Notes

The original plan should not be implemented exactly as written.

It should be approved only after applying these architecture changes:

1. Use `TransactionPayment` instead of `Transaction.paymentMethodId`.
2. Use balance-based `CustomerVoucher`.
3. Add `VoucherRedemption`.
4. Add snapshot fields on `TransactionItem`.
5. Use `serviceId` unless there is a unified product model.
6. Wrap checkout logic in `prisma.$transaction`.
7. Add cancel/refund/voucher reversal rules.

Once these changes are applied, the POS module architecture is suitable for a real multi-branch massage/spa POS system.
