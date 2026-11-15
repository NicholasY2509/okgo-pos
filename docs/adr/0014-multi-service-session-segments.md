# ADR-0014: Model Multi-Service Sessions via ServiceSessionSegment

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Engineering & Product Owner

## Context

`ServiceSession` currently assumes a 1:1 relationship with a single `serviceId`, `staffId`, `transactionItemId`, `startTime`/`endTime`, `actualStartTime`/`actualEndTime`, and `therapistCommissionAmount`. In daily operations, two common flows break this assumption:

1. **Chained services in one visit:** A customer completes Service A with Therapist A and immediately continues to Service B in the same room. Requiring Therapist A to walk downstairs to scan stop and scan start again is impractical.
2. **Mid-session service switch:** A customer books Service A (e.g. 120 minutes), then switches to Service B after 60 minutes. The initial transaction price remains fixed, while the remaining 60 minutes must be recorded as Service B and therapist commissions must reflect the split.

For both flows, the next service may be handled by the **same therapist** (single face-scan Start at session open and Stop at session close) or a **different therapist** (outgoing therapist scans Stop, incoming therapist scans Start on `nyenyak-portal`).

## Decision

We introduce a child model `ServiceSessionSegment` under `ServiceSession` (1-to-many) as the canonical unit of service execution, therapist assignment, and commission attribution.

- **`ServiceSession` (parent container):** Owns room, branch, customer, booking/transaction link, overall `status` (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), overall `startTime`/`endTime`, `actualStartTime`/`actualEndTime`, and customer review.
- **`ServiceSessionSegment` (child item):** Owns `serviceSessionId`, `sequenceOrder`, `serviceId`, `staffId`, `transactionItemId`, `durationMinutes`, `startTime`/`endTime`, `actualStartTime`/`actualEndTime`, `status`, `therapistCommissionAmount`, and `switchReason` (`INITIAL`, `CONTINUATION`, `MID_SESSION_SWITCH`).
- **Pricing & Commission:** Mid-session switches keep the original `Transaction` / `TransactionItem` total unchanged and split/calculate `StaffIncentive` per segment (referencing `serviceSessionSegmentId`). Chained additional services link to their respective `TransactionItem` if billed separately.
- **Portal Face-Scan Flow:** `/api/portal/sessions/[sessionId]/status` advances segments automatically when `staffId` matches the next segment, and enforces Stop (outgoing `staffId`) + Start (incoming `staffId`) face verification whenever `staffId` changes between segments.

## Consequences

### Easier

- Supports N services and N therapists within one continuous room occupancy (`ServiceSession`).
- Accurately tracks actual time per service and per therapist for `StaffIncentive` and payroll without altering settled `Transaction` totals on mid-session switches.
- Preserves one-time face scan for same-therapist continuations while enforcing face verification on therapist handoffs.

### Harder

- Requires backfilling existing `ServiceSession` rows into initial `ServiceSessionSegment` records (1:1 migration) and keeping parent summary fields (`serviceId`, `staffId`, `actualStartTime`, `actualEndTime`) synchronized or deprecated cleanly during rollout.
- Timetable, `ServiceSessionList`, and `nyenyak-portal` APIs must render and act on segments rather than assuming a single service/therapist per session.
- Reversing after production data accumulates would require flattening multi-segment sessions back into separate `ServiceSession` rows.

## Alternatives considered

### Chained `ServiceSession` via `parentSessionId` self-relation

Linking multiple `ServiceSession` rows together avoids a new table, but fractures room occupancy, review ratings, and portal session-level Start/Stop state across multiple rows, making mid-session 120-to-60+60 splits and single-scan same-therapist handoffs awkward.
