# ADR-0012: Multi-Instance Branch WhatsApp Configuration

## Context

Nyenyak operates multiple physical branches (e.g., Juanda, Gatot Subroto). Each branch communicates with customers using its own dedicated WhatsApp number.
In WhatsApp Multi-Device protocol (Baileys / Evolution API), an instance maintains exactly one persistent socket session linked to one phone number. Multiple phone numbers cannot share a single instance.
Previously, the system utilized a single global environment variable `EVOLUTION_INSTANCE_NAME`. We need to allow creating Evolution API instances directly from the app, linking each branch to its dedicated WhatsApp instance, managing pairing (QR/code) per branch in both the dedicated WhatsApp settings page and the Branch Detail page, and routing receipt dispatches dynamically through the branch's assigned instance.

## Decision

1. **Branch Schema Modification**:
   - Add optional `whatsappInstanceName String?` to the `Branch` model in `prisma/schema/branch.prisma`.
   - Update `PRISMA_SCHEMA_REVISION` in `lib/prisma.ts` and sync database schema via `prisma db push`.

2. **Evolution API Instance Lifecycle**:
   - Support `POST /instance/create` (`{ instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" }`) and `DELETE /instance/delete/:instanceName` in `WhatsappPairingService` and `EvolutionApiService`.
   - Enhance `fetchInstances` to inspect and map connection status, owner JID/phone, and pairing state across all instances.

3. **Multi-Location UI Access**:
   - **Dedicated WhatsApp Settings Page** (`/admin/whatsapp`): Displays a multi-instance dashboard with all branches, instance health, connection badges, creation modal, and instant pairing/sandbox.
   - **Branch Detail Page** (`/admin/branches/[slug]?tab=whatsapp`): Embeds a dedicated tab allowing branch managers/admins to link, create, pair, and test WhatsApp for that specific branch.

4. **Dynamic POS Dispatch Routing**:
   - In `InvoiceWhatsappService`, dynamically resolve the instance from `transaction.branch.whatsappInstanceName`. If undefined or empty, gracefully fallback to `process.env.EVOLUTION_INSTANCE_NAME`.

## Consequences

- **Positive**:
  - Each branch can use its own official phone number without code redeployments or server config edits.
  - New branches can be provisioned with WhatsApp integration entirely within the web UI.
  - Failures or disconnections in one branch instance do not disrupt other branches.
- **Trade-offs**:
  - Evolution API server must handle multiple concurrent Baileys WebSocket sessions (each ~20-50MB RAM).
  - Admin needs permission to manage instances across branches.

