---
trigger: always_on
---

# Okgo POS Architecture Blueprint

This document provides a highly detailed architectural overview of the Okgo POS application. The project is a modern web application built using **Next.js 15 (App Router)**, **React 19**, **Prisma ORM**, and a strict Domain-Driven Design (DDD) module pattern. 

---

## 1. Directory & Routing Architecture

The codebase separates the Next.js routing mechanism from the business logic.

### Next.js App Router (`app/`)
The `app/` directory handles routing, layouts, and API endpoints.

- **`app/(marketing)/`**: 
  - **`page.tsx`**: Public landing page for the POS system.
- **`app/[tenant]/`**: Dynamic route for branch-specific portals (e.g., `/downtown-branch/pos`).
  - **`pos/`**: The Point of Sale interface where transactions happen.
  - **`accounting/`**: Branch-level financial reports and accounting features.
  - **`hris/`**: Branch-level Human Resources Information System for staff management.
  - **`login/`**: Tenant-specific login page.
- **`app/admin/`**: Centralized administrative dashboard for global management.
  - **`branches/`**: Global branch management, including settings for specific branches (`[slug]/settings`).
  - **`products/`**: Global product catalog management (`/products` and `/products/[id]`).
  - **`staff/`**: Global staff database (`/staff` and `/staff/[id]`).
  - **`users/`**: System user management.
  - **`vouchers/`**: Creation and management of voucher packets.
  - **`work-positions/`**: Management of roles/positions.
- **`app/api/`**: Serverless endpoints.
  - **`auth/[...nextauth]/route.ts`**: NextAuth.js configuration for session management.
  - **`upload/route.ts`**: File upload endpoint.
- **`app/~offline/`**: PWA offline fallback page.

---

## 2. The Domain-Driven Module System (`modules/`)

The core business logic of Okgo POS is isolated inside the `modules/` directory. Each business domain is strictly encapsulated, ensuring that Next.js routes only act as presentation layers that compose these modules.

### Current Modules
1. **`auth`**: Authentication flow, handling login schemas, actions, and services.
2. **`branch`**: Branch creation, updating, and assigning users to branches.
3. **`product`**: Product and Category management. Includes schemas, DataTables, and form dialogs for items sold.
4. **`staff`**: Staff directory and management. Includes forms for onboarding and viewing staff details.
5. **`staff-user`**: Logic for linking NextAuth system `User` accounts to `Staff` profiles (e.g., assigning a login to an employee).
6. **`user`**: User database management (creating login accounts, resetting passwords).
7. **`vouchers`**: Voucher and Voucher Packet management (bundling vouchers with products).
8. **`work-position`**: Job titles/roles configuration for staff members.
9. **`core`**: Base generic utilities and services.

---

## 3. The `Component ➡️ Hook ➡️ Action ➡️ Service` Pattern

Every data submission flow within a module must follow this strict four-layer architecture. This isolates concerns, prevents messy "fat components," and guarantees security boundaries.

### Layer 1: Schema (`modules/[domain]/schemas/`)
Defines the single source of truth for data shapes and validation using **Zod**.
- **Role**: Both client-side form validation and server-side payload verification.
- **Example**: `voucher-packet.ts` validates that a packet has a positive price and a linked product.

### Layer 2: Service (`modules/[domain]/services/`)
The deepest layer. It interacts directly with the **Prisma ORM** and contains pure business logic.
- **Role**: Execute database queries (`prisma.product.findMany()`).
- **Rule**: Must never import Next.js utilities like `next/headers` or handle HTTP requests. It only takes inputs and returns data.
- **Example**: `voucher-packet-service.ts`

### Layer 3: Server Action (`modules/[domain]/actions/`)
Acts as the controller bridging the client and the Service.
- **Role**: Receives input from the client, validates it against the Zod Schema, calls the Service, and formats the response (or catches errors).
- **Rule**: Must contain `"use server"` at the top. Never trust the client.
- **Example**: `voucher-packet-action.ts` handles the creation action and returns `{ success: true, data }` or `{ error: "Message" }`.

### Layer 4: Hook (`modules/[domain]/hooks/`)
Custom React hooks managing client-side form state and submission.
- **Role**: Wraps `react-hook-form` and `@hookform/resolvers/zod`. Calls the Server Action when the form is submitted. Displays toasts (`sonner`) on success/error.
- **Example**: `use-voucher-packet.ts` manages the loading state and triggers the `createVoucherPacketAction`.

### Layer 5: Component (`modules/[domain]/components/`)
The React component that renders the HTML/UI.
- **Role**: Renders inputs, buttons, and error messages. Completely "dumb" regarding how data is saved; it just consumes the Hook.
- **Example**: `voucher-packet-form.tsx` uses `useVoucherPacket` to spread `form.register("price")` onto inputs.

---

## 4. UI Components (`components/`)

Shared components live outside the `modules/` directory.

- **`components/ui/`**: Base UI primitives generated by **Shadcn UI** (Tailwind CSS + Radix UI). Includes `button.tsx`, `dialog.tsx`, `data-table.tsx`, `sheet.tsx`, `sonner.tsx`, etc.
- **Layout Components**: 
  - `app-sidebar.tsx` & `app-sidebar-data.tsx`: Manages the application's global sidebar navigation.
  - `nav-main.tsx`, `nav-projects.tsx`, `nav-user.tsx`: Sub-components for the sidebar layout.
  - `theme-provider.tsx`: Manages dark/light mode switching.
  - `file-picker.tsx`: Custom component for uploading and selecting files.

---

## 5. Database & ORM (`prisma/` & `lib/`)

- **Database**: The application uses a relational database (SQLite for dev `dev.db`, Postgres/MySQL for production).
- **Prisma Schema (`prisma/schema.prisma`)**: Defines all tables and relationships.
- **Prisma Client (`lib/prisma.ts`)**: Initializes a singleton Prisma client to prevent connection exhaustion in development due to Next.js Hot Module Replacement.
- **Utils (`lib/utils.ts`)**: Contains standard Shadcn utility functions like `cn()` (clsx + tailwind-merge).

---

## 6. Code Style & Tooling

- **TypeScript**: Strict typing enforced globally.
- **Styling**: Tailwind CSS configured via `postcss.config.mjs` and `globals.css`.
- **Formatting**: Handled by Prettier (`.prettierrc`) and ESLint (`eslint.config.mjs`).
- **PWA**: Configured with Next-PWA (`manifest.ts`, `sw.ts`) to allow offline capabilities.
