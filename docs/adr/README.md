# Architecture Decision Records

Decisions that were expensive to make and would be expensive to reverse. Each file answers
"why is it built this way?" for a reader who has none of today's context.

> Maintained under Structure. A change matching a trigger below stops for an ADR and user
> confirmation **before** implementation, not after.

## Index

| # | Title | Status | Date |
| --- | --- | --- | --- |
| 0001 | [Modular DDD Architecture & 5-Layer Submission Pattern](0001-module-architecture-and-form-submission-pattern.md) | Accepted | 2026-10-18 |
| 0002 | [Adopt Vitest for Automated Unit and Domain Engine Testing](0002-adopt-vitest-for-automated-testing.md) | Accepted | 2026-10-18 |
| 0003 | [Direct Revenue Recognition for Voucher Purchases](0003-voucher-direct-revenue-accounting.md) | Accepted | 2026-10-18 |
| 0004 | [Store Attendance Machine Network IP and Port](0004-store-attendance-machine-network-ip.md) | Accepted | 2026-10-21 |
| 0005 | [Introduce Nyenyak Portal Flutter Application in Monorepo](0005-nyenyak-portal-flutter-app.md) | Accepted | 2026-10-28 |
| 0006 | [Nyenyak Portal REST Authentication Endpoint & HTTP Client](0006-nyenyak-portal-rest-auth.md) | Accepted | 2026-10-28 |
| 0007 | [Room-Bound Session Feed & Socket.io Live Updates in Nyenyak Portal](0007-nyenyak-portal-room-sessions-socket.md) | Accepted | 2026-10-28 |
| 0008 | [On-Device Passive Face Anti-Spoofing via TFLite & ML Kit](0008-nyenyak-portal-on-device-passive-face-liveness.md) | Accepted | 2026-10-29 |
| 0009 | [On-Device Face Embedding Registration & Verification with Server-Synced Profiles](0009-nyenyak-portal-face-recognition-registration-verification.md) | Accepted | 2026-11-01 |
| 0010 | [Introduce Nyenyak Print ESC/POS Thermal Printer Bridge Flutter App](0010-nyenyak-print-escpos-bridge-flutter-app.md) | Accepted | 2026-11-04 |
| 0011 | [Generate Invoice PDF via pdf-lib and Send via Evolution API WhatsApp](0011-whatsapp-invoice-pdf-via-evolution-api.md) | Accepted | 2026-11-08 |
| 0012 | [Multi-Instance Branch WhatsApp Configuration](0012-multi-instance-branch-whatsapp-configuration.md) | Accepted | 2026-11-08 |

## When an ADR is required

- Adding, removing, or major-version-upgrading a dependency
- Data model and schema changes — new tables, type changes, indexes for performance, backfills
- Architectural structure — a new service, layer, top-level directory, or deployable unit
- Cross-cutting patterns — auth, error handling, state management, data fetching, caching, queues
- Anything that can break existing callers — signature, API shape, rename, changed default
- External integrations and new infrastructure dependencies
- Anything touching credentials, permissions, or cryptography

## When it is not

Bug fixes, features following an established pattern, styling, copy, tests, formatting,
local refactors, patch-version bumps, reverting an unreleased change.

**The test:** would a competent engineer joining in six months be confused by this choice,
or consider it obvious? Confusion means ADR.

## Conventions

- Filename: `NNNN-kebab-case-title.md`, four digits, sequential, never reused.
- Status is one of `Proposed`, `Accepted`, `Superseded by ADR-NNNN`, `Deprecated`.
- A superseded ADR is never edited or deleted — mark its status and link forward.
- Keep each record under ~80 lines. Density beats completeness; long ADRs go unread.
- Update this index in the same change as the ADR.
