# ADR-0007: Room-Bound Session Feed & Socket.io Live Updates in Nyenyak Portal

- **Status:** Accepted
- **Date:** 2026-10-28
- **Deciders:** Okgo POS Engineering Team

## Context

Each physical room in a Nyenyak branch is assigned a dedicated device running `nyenyak-portal`. Once authenticated into the branch, staff select which room the device belongs to and view all service sessions (`ServiceSession`) arranged for that room. When front-desk cashiers or managers assign a session at checkout, process an online booking, move a session between rooms, or start/complete a session in `nyenyak-pos`, the room's device must update immediately in real time without manual refresh.

## Decision

We implement a room-scoped session endpoint and connect `nyenyak-portal` to the existing Socket.io server (`socket-server.js` on port `3001`) via `package:socket_io_client`:

1. **Backend Endpoint (`GET /api/portal/rooms/[roomId]/sessions?branchId=<id>`)**:
   - Validates `roomId` and `branchId` (`portalRoomSessionsQuerySchema`).
   - Queries arranged `ServiceSession` records (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`) for the specified room and branch, ordered chronologically by `startTime`, enriched with service name, customer name, therapist name, timestamps, and VIP status via `TimetableService.getRoomSessions`.
2. **Socket.io Room Broadcasts (`socket-server.js` & POS Actions)**:
   - Extends `socket-server.js` with `join_room` (`room:<roomId>`) and broadcasts `service_assigned`, `service_status_changed`, and `new_booking` events to both the branch channel and affected room channels.
   - Emits room/session update events when transactions are created at POS checkout, when bookings are assigned to rooms, and when timetable sessions are started, completed, or moved between rooms.
3. **Flutter Socket.io Integration (`socket_io_client`)**:
   - Adds `socket_io_client` to `nyenyak-portal/pubspec.yaml`.
   - Configures `ApiConfig.socketUrl` (`--dart-define=NYENYAK_SOCKET_URL`, defaulting to `http://localhost:3001`).
   - When a room card is selected in `nyenyak-portal`, `RoomListController` binds `selectedRoom`, fetches its arranged sessions via `RoomRepository.getRoomSessions`, subscribes to Socket.io events for that branch and room, and automatically refreshes the session list when an update event arrives.

## Consequences

### Easier

- Instant real-time synchronization between the front-desk POS timetable/checkout and physical room devices using the existing `socket-server.js` infrastructure.
- Clean separation between room selection and the dedicated room session monitor.

### Harder

- Local USB debugging requires forwarding port `3001` in addition to `3000` (`adb reverse tcp:3001 tcp:3001`).

## Alternatives considered

### Raw `web_socket_channel`
- Rejected because `socket-server.js` uses Socket.io v4 framing (`EIO=4`) and room namespaces rather than raw WebSocket messages.

### Periodic HTTP Polling Only
- Rejected because polling introduces latency and unnecessary server load compared to event-driven Socket.io broadcasts.

