# ADR-0011: Generate Invoice PDF via pdf-lib and Send via Evolution API WhatsApp

- **Status:** Accepted
- **Date:** 2026-11-08
- **Deciders:** User, Antigravity Agent

## Context

Nyenyak POS operators on the tenant side need the ability to send professional invoice PDFs directly to customers over WhatsApp after checkout or from transaction history. The system has a co-located Evolution API service running on port 8080 with a connected WhatsApp instance (`tester`). 

Generating PDFs on the server in Next.js requires a solution that does not rely on heavy native C++ binaries, Chromium/Puppeteer processes, or DOM canvas emulation, which add major latency and break easily across OS environments and serverless runtimes.

## Decision

We adopt `pdf-lib` to generate vector PDF invoices in memory and send them as Base64 media documents to Evolution API's `POST /message/sendMedia/{instanceName}` endpoint.

The implementation adheres to the 5-layer module architecture under `modules/pos/`:
1. `schemas/invoice-whatsapp-schema.ts`: Input validation with Indonesian phone normalization (`08...` -> `628...`).
2. `services/invoice-pdf-service.ts`: Programmatic vector invoice generation with branch header, customer info, itemized table, discounts, vouchers, and payments.
3. `services/evolution-api-service.ts`: REST client for Evolution API with `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, and `EVOLUTION_INSTANCE_NAME`.
4. `actions/send-invoice-whatsapp-action.ts`: Server action orchestrating PDF synthesis and Evolution API transmission.
5. `hooks/use-send-invoice-whatsapp.ts` and `components/send-whatsapp-invoice-dialog.tsx`: Client dialog integrated into transaction details and POS checkout.

## Consequences

### Easier
- Fast in-memory PDF generation (pure JavaScript/TypeScript, 0 native dependencies).
- Seamless delivery of branded PDF documents straight to customer WhatsApp inboxes without requiring publicly hosted file storage.
- Cashiers can verify or edit the destination WhatsApp number for walk-in or registered customers.

### Harder
- Layout positioning in `pdf-lib` uses coordinate-based drawing rather than HTML/CSS templates.
- Requires Evolution API service to be reachable at `EVOLUTION_API_URL` with an active WhatsApp instance session.

## Alternatives considered

### Puppeteer / Playwright HTML-to-PDF
- Rejected: Requires heavy Chromium binary installation, high RAM consumption (~200MB+ per render), and slow execution for a POS cashier workflow.

### React-PDF (@react-pdf/renderer)
- Rejected: Heavy dependency footprint, compatibility friction with React 19 and Next.js 16 bundler.

### Text-only WhatsApp Message
- Rejected: Lacks professional branding, accounting validity, and official receipt feel requested by management.

