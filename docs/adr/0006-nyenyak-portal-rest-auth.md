# ADR-0006: Nyenyak Portal REST Authentication Endpoint & HTTP Client

- **Status:** Accepted
- **Date:** 2026-10-28
- **Deciders:** Okgo POS Engineering Team

## Context

`nyenyak-pos` authenticates web users via Next.js Server Actions (`loginAction`) and NextAuth v5 cookie-based credential redirects. Native mobile and tablet clients (`nyenyak-portal`) cannot invoke Next.js Server Actions directly and need a JSON REST endpoint that verifies credentials against the same Prisma database, bcrypt hashes, and branch/role rules in `AuthService.verifyCredentials`.

## Decision

We expose a JSON REST endpoint at `POST /api/portal/auth/login` (`app/api/portal/auth/login/route.ts`) and connect `nyenyak-portal` to it using the official Dart `http` package (`package:http`):

1. **Backend Endpoint (`POST /api/portal/auth/login`)**:
   - Validates the incoming JSON payload with `loginSchema` (`email`, `password`, optional `subdomain`).
   - Calls `AuthService.verifyCredentials(email, password, subdomain)`.
   - Returns HTTP 200 `{ success: true, data: { id, name, email, role } }` on success, HTTP 400 on validation failure, or HTTP 401 `{ error: string }` on credential/access rejection.
2. **Flutter HTTP & Local Session Persistence Integration**:
   - Adds `http`, `flutter_dotenv`, and `shared_preferences` to `nyenyak-portal/pubspec.yaml` and configures `android.permission.INTERNET` in Android manifests and network client entitlements on macOS.
   - Centralizes API and Socket.io URL resolution in `nyenyak-portal/lib/core/config/api_config.dart`, loading `NYENYAK_API_BASE_URL` and `NYENYAK_SOCKET_URL` from `nyenyak-portal/.env` via `flutter_dotenv` (with optional `--dart-define` overrides and fallback defaults `http://localhost:3000` / `http://localhost:3001`).
   - Updates `PortalAuthRepository` to send `POST /api/portal/auth/login` via `http.Client`, deserialize the response into `AuthSession`, and persist the authenticated `AuthSession` locally via `SharedPreferences` without an expiration TTL until the user explicitly signs out (`signOut()`).
   - Hydrates the persisted `AuthSession` (and bound `PortalRoom` selection in `RoomListController`) on startup in `main.dart` before `runApp` so room-station tablets remain logged in across app restarts and device reboots.

## Consequences

### Easier

- Single source of truth for user authentication: web and mobile share `AuthService.verifyCredentials`, bcrypt password verification, and branch role resolution.
- `http.Client` injection in `PortalAuthRepository` keeps unit and widget tests fast, deterministic, and offline-capable via `http/testing.dart` (`MockClient`).

### Harder

- Live login from an emulator or physical device requires the `nyenyak-pos` server to be running and reachable at `NYENYAK_API_BASE_URL`.

## Alternatives considered

### Calling NextAuth's `/api/auth/callback/credentials` from Flutter
- Rejected because NextAuth v5 requires CSRF token cookie handshakes and returns HTML redirects rather than a clean JSON contract for native apps.

### Using `dio` instead of `package:http`
- Rejected because the official Dart `http` package is lighter, maintained by the Dart team, and includes `package:http/testing.dart` for zero-dependency mock client testing.

