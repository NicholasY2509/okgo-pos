# ADR-0010: Introduce Nyenyak Print ESC/POS Thermal Printer Bridge Flutter App

- **Status:** Accepted
- **Date:** 2026-11-04
- **Deciders:** Okgo POS Engineering Team

## Context

Web browsers running the Okgo POS application (Chrome/Safari on Android, iOS, or desktop tablets) cannot reliably or uniformly send raw ESC/POS byte streams to Bluetooth thermal receipt printers without intrusive browser prompts or platform-restricted Web Bluetooth APIs. We need a standalone companion Flutter application that runs on the POS device, pairs with 58mm or 80mm Bluetooth ESC/POS thermal printers, and exposes a local loopback HTTP and WebSocket server so the POS web interface can trigger silent receipt printing directly from JavaScript.

## Decision

We introduce a top-level Flutter application directory at `./nyenyak-print` (Dart package name `nyenyak_print`):

1. **Directory Isolation**:
   - All Flutter/Dart source code and platform runners live under `./nyenyak-print/`.
   - Root `tsconfig.json` and `eslint.config.mjs` exclude `nyenyak-print/**` so web typechecking and linting remain fast and isolated.
2. **Local Loopback HTTP & WebSocket Bridge (`127.0.0.1:9123`)**:
   - Uses `dart:io` `HttpServer` bound to `127.0.0.1` (default port `9123`, configurable in app settings) with full CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Private-Network: true`) to satisfy Chrome Private Network Access (PNA) preflight checks from HTTPS/HTTP web origins.
   - Exposes `GET /status`, `POST /print`, `POST /test-print`, and `WS /ws` endpoints.
3. **ESC/POS Byte Compiler & Bluetooth Thermal Transport**:
   - Includes a deterministic Dart ESC/POS command builder supporting both `58mm` (32 characters/line) and `80mm` (48 characters/line) thermal paper widths, text styles, two-column key-value alignment, itemized receipt tables, QR codes, paper cut, and cash drawer kick (`ESC p`).
   - Uses `print_bluetooth_thermal` and `permission_handler` for Bluetooth printer discovery, pairing verification, auto-reconnect via `shared_preferences`, and raw byte transmission.
4. **Layered Architecture & Visual Alignment**:
   - Mirrors the layered separation (`models`, `repositories`, `services`, `controllers`, `presentation`) and `DESIGN.md` tokens (`NyenyakTheme` with `Plus Jakarta Sans`).

## Consequences

### Easier

- Any web page on the POS device can check printer readiness and print receipts with a single `fetch("http://127.0.0.1:9123/print", ...)` request or WebSocket message.
- Supports both 58mm and 80mm thermal printers with built-in test printing, live print job activity logs, and interactive receipt preview inside the bridge app.

### Harder

- Requires the `Nyenyak Print` bridge app to be running and paired with the Bluetooth printer on the POS device.
- Android 12+ requires runtime `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT` permissions before printer discovery.

## Alternatives considered

### Web Bluetooth API Directly in Browser
- Rejected because Safari/iOS does not support Web Bluetooth, Chrome requires manual user gesture device pickers per session, and Bluetooth Classic (SPP) printers are not exposed to Web Bluetooth (BLE-only).

### Embedded WebView Wrapper App
- Rejected because staff already run the POS web app inside full-featured browsers (PWA/Chrome/Safari) and only need a lightweight local hardware bridge for printing.

