# ADR-0005: Fingerspot Developer Cloud API Integration

- **Status:** Accepted
- **Date:** 2026-11-09
- **Deciders:** Okgo POS Engineering Team

## Context

Biometric attendance machines (such as Fingerspot Vida W-2411M) previously communicated with our application using direct HTTP push configurations on local LANs or port-forwarded routers. To provide reliable centralized management across hotel capsule branches without maintaining public IPs or VPNs at each location, the client has adopted `developer.fingerspot.io` (Fingerspot Cloud API).

We need to:
1. Adapt our webhook endpoint to process incoming real-time punch events (`type: "attlog"`) sent by Fingerspot Cloud.
2. Support outbound REST API calls to `https://developer.fingerspot.io` for fetching stored attendance logs (`get_attlog`), inspecting device status (`get_device`), and retrieving user credentials from machines (`get_userid_list`, `get_userinfo`).
3. Provide an administrative dashboard page for operators to monitor live punches, trigger manual log pulls, and query user credentials from connected machines.

## Decision

1. **Dual-Format Webhook Handling**:
   - Update `app/api/attendance/webhook/route.ts` to detect and parse both the legacy direct hardware push format (`parsedData.Events[0].Data`) and the Fingerspot.iO Cloud format (`parsedData.type === "attlog"`).
   - Normalize punch statuses across both systems so that clock-in and clock-out events seamlessly update `Attendance` and `AttendanceMachineLog` records.
   - Capture asynchronous callback payloads (e.g. `get_userinfo`, `get_userid_list`) so operators can inspect returned user profiles.

2. **Dedicated `modules/fingerspot` Architecture**:
   - Follow strict 5-layer separation:
     - `schemas/fingerspot-schema.ts`: Validation for API requests (API token, Cloud ID, date ranges, PIN queries).
     - `repositories/fingerspot-repository.ts`: Data access for machine records and recent punch logs.
     - `services/fingerspot-service.ts`: HTTP communication with `developer.fingerspot.io` endpoints (`get_attlog`, `get_device`, `get_userid_list`, `get_userinfo`) and database import logic.
     - `actions/fingerspot-action.ts`: Server Actions controller for client interactions.
     - `hooks/use-fingerspot.ts`: State management and toast feedback for the UI.
     - `components/`: UI cards for live punch logs, pulling logs, querying users, and machine connection diagnostics.

3. **Admin Integration Page**:
   - Provide `/admin/attendance/fingerspot` page in the admin navigation under the "Kehadiran" section.

## Consequences

### Easier

- Zero requirement for static public IPs, dynamic DNS, or port forwarding at branch hotel capsule locations.
- Support for on-demand log recovery via `get_attlog` if local internet was temporarily down.
- Single interface to monitor live attendance punches and test machine communication.

### Harder

- Asynchronous operations (`get_userinfo`, `get_userid_list`) rely on Fingerspot's cloud queue and callback delivery to our webhook rather than immediate synchronous responses.

