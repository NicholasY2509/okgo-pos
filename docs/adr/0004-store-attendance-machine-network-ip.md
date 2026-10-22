# ADR-0004: Store Attendance Machine Network IP and Port

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** Okgo POS Engineering Team

## Context

Attendance machines (such as Fingerspot Vida/Vivo series) reside on local Wi-Fi / LAN networks and expose HTTP CGI endpoints for pulling attendance transaction records and subscribing to real-time events.

Previously, `AttendanceMachine` only recorded `sn`, `name`, `branchId`, and `isActive`. Synchronizing attendance logs required operators to manually input or rely on hardcoded IP addresses. To automate on-demand or periodic log pulling across different branches, the system needs to persist each machine's network address and port directly within the machine registry.

## Decision

We extend the `AttendanceMachine` data model in Prisma and the corresponding attendance-machine module layers:

1. **Schema Extension**:
   - `ipAddress String?`: Stores the local IPv4 address or hostname assigned to the machine (e.g. `192.168.1.231`).
   - `port Int? @default(80)`: Stores the machine's HTTP management/API port (defaults to 80).
2. **Form and UI**:
   - Expose IP Address and Port fields in the Machine Registration modal (`machine-form.tsx`).
   - Display the IP Address in the Machine Table (`machine-table.tsx`).
3. **Integration with Log Pull**:
   - Provide the registered IP as the default target in the attendance log sync workflow.

## Consequences

### Easier

- Allows multi-branch machines to each have their unique static IP / port persisted in the database.
- Eliminates hardcoded machine IPs in synchronization scripts and client dialogs.
- Enables background cron or workers to iterate through active machines and pull logs automatically.

### Harder

- Machines on dynamic DHCP may change IPs if router reservations are not configured, requiring manual updates in the admin dashboard.

## Alternatives considered

### Storing `ipAddress` only without `port`
- Rejected in favor of storing both `ipAddress` and `port` to accommodate installations with custom ports or port-forwarded branch gateways.
