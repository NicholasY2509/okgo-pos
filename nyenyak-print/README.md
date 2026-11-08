# Nyenyak Print (`nyenyak-print`)

Standalone Flutter ESC/POS thermal printer bridge application for **Okgo POS (Nyenyak POS)**.

Runs a local loopback HTTP & WebSocket server (`127.0.0.1:9123` by default) with CORS and Chrome Private Network Access headers so any POS web page can check printer readiness and silently print 58mm (32 cols) or 80mm (48 cols) receipts to a paired Bluetooth thermal printer.

## Endpoints

- **`GET http://127.0.0.1:9123/status`** — Returns bridge status, paper width (`58mm` / `80mm`), and connected Bluetooth printer details.
- **`POST http://127.0.0.1:9123/print`** — Compiles a JSON receipt payload (or raw Base64 ESC/POS stream) and sends it to the connected Bluetooth thermal printer.
- **`POST http://127.0.0.1:9123/test-print`** — Prints a sample Nyenyak POS receipt.
- **`WS ws://127.0.0.1:9123/ws`** — Real-time WebSocket channel for status broadcasts and `{"action": "print", "payload": {...}}` jobs.

## Development

```bash
cd nyenyak-print
flutter pub get
dart analyze
flutter test
flutter run
```
