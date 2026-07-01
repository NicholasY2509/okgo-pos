# Full-Stack Next.js Modular Project Structure

This document describes a recommended modular folder structure for building a full-stack Next.js application.

The goal is to keep the project scalable, easy to maintain, and clear for both frontend and backend development.

This structure is suitable for applications such as:

- POS systems
- HRMS systems
- Inventory systems
- SaaS dashboards
- Admin panels
- Multi-tenant applications
- Internal business systems

---

## Core Principle

A full-stack Next.js app should not be treated as frontend-only.

Next.js can handle:

- Frontend pages
- Server-rendered data fetching
- Backend API routes
- Server Actions
- Authentication/session handling
- Database access through Prisma or another ORM

However, backend logic should not be placed randomly inside components, pages, or route handlers.

Use this flow:

```txt
Page / Route / Server Action
  ↓
Module Query / Module Action
  ↓
Service
  ↓
Repository
  ↓
Database
```

The important rule:

```txt
Pages and routes should be thin.
Business logic should live inside modules.
Database logic should live inside repositories.
```

---

## Recommended Folder Structure

```txt
src/
  app/
    (auth)/
      login/
        page.tsx

    (dashboard)/
      layout.tsx
      dashboard/
        page.tsx
      products/
        page.tsx
      orders/
        page.tsx
      customers/
        page.tsx

    api/
      products/
        route.ts
      orders/
        route.ts
      customers/
        route.ts

  modules/
    auth/
      components/
      server/
      actions/
      queries/
      schemas/
      types/

    users/
      components/
      server/
      actions/
      queries/
      schemas/
      types/

    roles/
      components/
      server/
      actions/
      queries/
      schemas/
      types/

    products/
      components/
        ProductTable.tsx
        ProductForm.tsx
        ProductDeleteDialog.tsx

      server/
        product.service.ts
        product.repository.ts

      actions/
        product.actions.ts

      queries/
        product.queries.ts

      schemas/
        product.schema.ts

      types/
        product.types.ts

      constants.ts

    orders/
      components/
        OrderCart.tsx
        OrderSummary.tsx
        OrderItemTable.tsx

      server/
        order.service.ts
        order.repository.ts
        order-calculation.service.ts

      actions/
        order.actions.ts

      queries/
        order.queries.ts

      schemas/
        order.schema.ts

      types/
        order.types.ts

      constants.ts

  shared/
    components/
      ui/
        Button.tsx
        Input.tsx
        Modal.tsx
        DataTable.tsx

      layout/
        Sidebar.tsx
        Header.tsx
        Breadcrumb.tsx

    hooks/
      useDebounce.ts
      useDisclosure.ts

    lib/
      utils.ts
      formatCurrency.ts
      api-response.ts
      pagination.ts

    types/
      api.types.ts
      pagination.types.ts

  server/
    db/
      prisma.ts

    auth/
      session.ts
      permissions.ts
      password.ts

    config/
      env.ts

    logger/
      logger.ts

  middleware.ts

prisma/
  schema.prisma
  migrations/
```

---

## Folder Responsibilities

### `src/app`

The `app` folder should only handle routing.

It contains:

- Pages
- Layouts
- Loading UI
- Error UI
- Route Handlers
- Route groups

Avoid placing business logic directly inside `page.tsx` or `route.ts`.

Good:

```tsx
// src/app/(dashboard)/products/page.tsx

import { getProductsQuery } from "@/modules/products/queries/product.queries";
import { ProductTable } from "@/modules/products/components/ProductTable";

export default async function ProductsPage() {
  const products = await getProductsQuery();

  return <ProductTable products={products} />;
}
```

Bad:

```tsx
// Do not do this

import { prisma } from "@/server/db/prisma";

export default async function ProductsPage() {
  const products = await prisma.product.findMany();

  return <ProductTable products={products} />;
}
```

The page should not directly know how the database works.

---

### `src/modules`

The `modules` folder contains business features.

Each module represents one domain of the application.

Example modules:

```txt
modules/
  auth/
  users/
  roles/
  branches/
  products/
  categories/
  customers/
  orders/
  payments/
  reports/
```

Each module can contain:

```txt
components/
server/
actions/
queries/
schemas/
types/
constants.ts
```

This keeps related code close together.

For example, everything related to products lives inside:

```txt
modules/products/
```

---

### `components`

Module-specific components should stay inside the module.

Example:

```txt
modules/products/components/ProductTable.tsx
modules/products/components/ProductForm.tsx
```

Shared reusable components should go into:

```txt
shared/components/
```

Examples of shared components:

```txt
Button
Input
Modal
DataTable
Sidebar
Header
Breadcrumb
```

Rule:

```txt
If the component is only used by one module, keep it inside that module.
If the component is reused across many modules, move it to shared/components.
```

---

### `server`

The module `server` folder contains backend logic specific to that module.

Example:

```txt
modules/products/server/product.service.ts
modules/products/server/product.repository.ts
```

The service contains business logic.

The repository contains database queries.

---

## Service Layer

The service layer handles business rules.

Example:

```ts
// src/modules/products/server/product.service.ts

import { productRepository } from "./product.repository";
import { CreateProductInput } from "../types/product.types";

export async function getProducts() {
  return productRepository.findMany();
}

export async function createProduct(input: CreateProductInput) {
  const existingProduct = await productRepository.findByName(input.name);

  if (existingProduct) {
    throw new Error("Product already exists");
  }

  return productRepository.create(input);
}
```

Use services for:

- Business rules
- Authorization checks
- Validation after schema parsing
- Calculations
- Multi-step workflows
- Calling multiple repositories

Example in POS:

```txt
Create order
  - Check product exists
  - Check stock availability
  - Calculate subtotal
  - Apply discount
  - Calculate tax
  - Create order
  - Create order items
  - Update stock
```

That logic belongs in a service, not in a page or route.

---

## Repository Layer

The repository layer handles database queries.

Example:

```ts
// src/modules/products/server/product.repository.ts

import { prisma } from "@/server/db/prisma";
import { CreateProductInput } from "../types/product.types";

export const productRepository = {
  findMany() {
    return prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.product.findUnique({
      where: {
        id,
      },
    });
  },

  findByName(name: string) {
    return prisma.product.findFirst({
      where: {
        name,
      },
    });
  },

  create(data: CreateProductInput) {
    return prisma.product.create({
      data,
    });
  },

  update(id: string, data: Partial<CreateProductInput>) {
    return prisma.product.update({
      where: {
        id,
      },
      data,
    });
  },

  delete(id: string) {
    return prisma.product.delete({
      where: {
        id,
      },
    });
  },
};
```

Repositories should not contain UI logic.

Repositories should not know about forms, pages, or React components.

---

## Queries

Queries are used for reading data from Server Components.

Example:

```ts
// src/modules/products/queries/product.queries.ts

import { getProducts } from "../server/product.service";

export async function getProductsQuery() {
  return getProducts();
}
```

Then use it in a page:

```tsx
// src/app/(dashboard)/products/page.tsx

import { getProductsQuery } from "@/modules/products/queries/product.queries";
import { ProductTable } from "@/modules/products/components/ProductTable";

export default async function ProductsPage() {
  const products = await getProductsQuery();

  return <ProductTable products={products} />;
}
```

This keeps pages clean.

---

## Server Actions

Server Actions are useful for mutations from your own Next.js app.

Use Server Actions for:

- Create form
- Update form
- Delete button
- Submit approval
- Checkout order
- Change status
- Upload form
- Internal dashboard actions

Example:

```ts
// src/modules/products/actions/product.actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { createProductSchema } from "../schemas/product.schema";
import { createProduct } from "../server/product.service";

export async function createProductAction(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    price: Number(formData.get("price")),
  };

  const validated = createProductSchema.parse(raw);

  await createProduct(validated);

  revalidatePath("/products");
}
```

Then use it in a form:

```tsx
// src/modules/products/components/ProductForm.tsx

import { createProductAction } from "../actions/product.actions";

export function ProductForm() {
  return (
    <form action={createProductAction}>
      <input name="name" placeholder="Product name" />
      <input name="price" type="number" placeholder="Price" />
      <button type="submit">Save</button>
    </form>
  );
}
```

---

## Route Handlers

Use Route Handlers when you need real API endpoints.

Use Route Handlers for:

- Mobile app API
- External system integration
- Webhooks
- Public API
- Printer bridge API
- Third-party callbacks
- Client-side fetching with TanStack Query
- API consumed by another frontend

Example:

```ts
// src/app/api/products/route.ts

import { NextResponse } from "next/server";
import { getProducts, createProduct } from "@/modules/products/server/product.service";
import { createProductSchema } from "@/modules/products/schemas/product.schema";

export async function GET() {
  const products = await getProducts();

  return NextResponse.json({
    data: products,
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  const validated = createProductSchema.parse(body);

  const product = await createProduct(validated);

  return NextResponse.json({
    data: product,
  });
}
```

The route handler should stay thin.

Do not put business logic directly in `route.ts`.

---

## Schemas

Use schemas for validation.

Recommended library:

```txt
Zod
```

Example:

```ts
// src/modules/products/schemas/product.schema.ts

import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
```

Use schemas in:

- Server Actions
- Route Handlers
- Forms
- API validation

---

## Types

Use module-specific types inside each module.

Example:

```ts
// src/modules/products/types/product.types.ts

export type Product = {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProductInput = {
  name: string;
  price: number;
};

export type UpdateProductInput = Partial<CreateProductInput>;
```

Shared/global types should go into:

```txt
shared/types/
```

Example:

```ts
// src/shared/types/api.types.ts

export type ApiResponse<T> = {
  data: T;
  message?: string;
};
```

---

## Shared Folder

The `shared` folder is for reusable code that does not belong to one specific module.

Examples:

```txt
shared/
  components/
  hooks/
  lib/
  types/
```

Good candidates for `shared`:

- Button
- Input
- Modal
- DataTable
- formatCurrency
- formatDate
- useDebounce
- pagination helper
- API response helper

Do not put module-specific logic in `shared`.

Bad:

```txt
shared/lib/calculateOrderTotal.ts
```

Better:

```txt
modules/orders/server/order-calculation.service.ts
```

Because order calculation is business logic for the orders module.

---

## Global Server Folder

The root `server` folder is for global backend infrastructure.

Example:

```txt
server/
  db/
    prisma.ts

  auth/
    session.ts
    permissions.ts
    password.ts

  config/
    env.ts

  logger/
    logger.ts
```

This folder should contain things used by many modules.

Example:

```ts
// src/server/db/prisma.ts

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## Client Components

Use Client Components only when needed.

Use `"use client"` for:

- State
- Event handlers
- Effects
- Browser APIs
- Modals
- Dropdowns
- Interactive tables
- React Hook Form
- TanStack Query
- Zustand
- Local UI state

Example:

```tsx
"use client";

import { useState } from "react";

export function ProductDeleteDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Delete</button>

      {open && (
        <div>
          <p>Are you sure?</p>
          <button onClick={() => setOpen(false)}>Cancel</button>
        </div>
      )}
    </>
  );
}
```

Do not make everything a Client Component.

Default to Server Components first.

---

## Server Components

Use Server Components for:

- Fetching data
- Rendering static or server-rendered UI
- Accessing database indirectly through services
- Reading session server-side
- Rendering dashboard pages

Example:

```tsx
// Server Component by default

import { getProductsQuery } from "@/modules/products/queries/product.queries";

export default async function ProductsPage() {
  const products = await getProductsQuery();

  return (
    <div>
      <h1>Products</h1>
      <pre>{JSON.stringify(products, null, 2)}</pre>
    </div>
  );
}
```

---

## TanStack Query

Use TanStack Query when the frontend needs interactive client-side fetching.

Good use cases:

- Search/filter without full page reload
- Pagination
- Infinite scroll
- Real-time-like refresh
- Cashier screen
- POS order screen
- Data that changes frequently
- Optimistic updates
- Client-side mutation state

Example:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function ProductClientTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      const json = await response.json();

      return json.data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

Do not use TanStack Query for everything.

For simple server-rendered dashboard pages, prefer Server Components.

Recommended rule:

```txt
Server Components for initial page data.
TanStack Query for highly interactive client-side data.
Server Actions for internal mutations.
Route Handlers for APIs.
```

---

## Authentication

Authentication should be centralized.

Recommended structure:

```txt
server/auth/
  session.ts
  permissions.ts
  password.ts
```

Example:

```ts
// src/server/auth/permissions.ts

export function canManageProducts(role: string) {
  return ["admin", "manager"].includes(role);
}
```

Use permissions inside services:

```ts
// src/modules/products/server/product.service.ts

import { canManageProducts } from "@/server/auth/permissions";

export async function createProduct(input: CreateProductInput, userRole: string) {
  if (!canManageProducts(userRole)) {
    throw new Error("Unauthorized");
  }

  return productRepository.create(input);
}
```

Do not spread permission checks randomly across components.

---

## Middleware

Use `middleware.ts` for route-level access control.

Example use cases:

- Redirect unauthenticated users to login
- Redirect authenticated users away from login page
- Protect dashboard routes
- Detect tenant/subdomain
- Attach branch/tenant context

Example:

```ts
// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/products", "/orders"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## Multi-Tenant / Multi-Branch Structure

For SaaS, POS, or branch-based systems, tenant or branch context should be handled carefully.

Common approaches:

```txt
branch-a.example.com
branch-b.example.com
admin.example.com
```

or:

```txt
example.com/branch-a
example.com/branch-b
```

For subdomain-based branches, middleware can read the host:

```ts
// src/middleware.ts

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const subdomain = host?.split(".")[0];

  // Example:
  // branch-a.example.com => branch-a

  return NextResponse.next();
}
```

Inside backend logic, always scope data by tenant or branch.

Example:

```ts
// src/modules/products/server/product.repository.ts

findManyByBranch(branchId: string) {
  return prisma.product.findMany({
    where: {
      branchId,
    },
  });
}
```

Important rule:

```txt
Never trust branchId only from the frontend.
Resolve branch/tenant on the server.
```

---

## Example POS Modules

For a POS system, the modules could look like this:

```txt
modules/
  auth/
  users/
  roles/
  branches/
  customers/
  categories/
  products/
  modifiers/
  orders/
  payments/
  printers/
  reports/
  settings/
```

Example order module:

```txt
modules/orders/
  components/
    OrderCart.tsx
    OrderSummary.tsx
    OrderItemTable.tsx
    OrderPaymentDialog.tsx

  server/
    order.service.ts
    order.repository.ts
    order-calculation.service.ts
    order-payment.service.ts

  actions/
    order.actions.ts

  queries/
    order.queries.ts

  schemas/
    order.schema.ts

  types/
    order.types.ts

  constants.ts
```

Order creation should be handled in the service:

```txt
order.service.ts
  - validate cart items
  - check product availability
  - calculate subtotal
  - apply discounts
  - calculate tax
  - create transaction
  - create transaction items
  - create payment record
  - update stock
```

Do not place this logic inside:

```txt
OrderCart.tsx
page.tsx
route.ts
```

---

## Naming Convention

Use consistent naming.

Recommended:

```txt
product.service.ts
product.repository.ts
product.actions.ts
product.queries.ts
product.schema.ts
product.types.ts
```

For components:

```txt
ProductTable.tsx
ProductForm.tsx
ProductDeleteDialog.tsx
ProductFilter.tsx
```

For folders:

```txt
modules/products
modules/orders
modules/customers
```

Use plural names for modules because they usually represent resources.

---

## Import Direction Rules

Use a clear dependency direction.

Allowed:

```txt
app → modules
modules → shared
modules → server
modules/server → server/db
```

Avoid:

```txt
shared → modules
server → app
server → components
repository → service
```

Recommended flow:

```txt
Page
  → Query / Action
    → Service
      → Repository
        → Prisma
```

---

## What Goes Where?

### Product table

```txt
modules/products/components/ProductTable.tsx
```

### Product validation

```txt
modules/products/schemas/product.schema.ts
```

### Product database query

```txt
modules/products/server/product.repository.ts
```

### Product business rule

```txt
modules/products/server/product.service.ts
```

### Product create action

```txt
modules/products/actions/product.actions.ts
```

### Product API endpoint

```txt
src/app/api/products/route.ts
```

### Reusable button

```txt
shared/components/ui/Button.tsx
```

### Prisma client

```txt
server/db/prisma.ts
```

### Auth session helper

```txt
server/auth/session.ts
```

### Currency formatter

```txt
shared/lib/formatCurrency.ts
```

---

## Common Mistakes to Avoid

### 1. Putting database queries directly in pages

Bad:

```tsx
const products = await prisma.product.findMany();
```

Better:

```tsx
const products = await getProductsQuery();
```

---

### 2. Putting business logic in components

Bad:

```tsx
function OrderCart() {
  // calculate discount
  // calculate tax
  // validate stock
  // create order
}
```

Better:

```txt
modules/orders/server/order-calculation.service.ts
modules/orders/server/order.service.ts
```

---

### 3. Making everything a Client Component

Bad:

```tsx
"use client";

export default function ProductsPage() {
  // fetch products on client
}
```

Better:

```tsx
export default async function ProductsPage() {
  const products = await getProductsQuery();

  return <ProductTable products={products} />;
}
```

Use Client Components only when interactivity is required.

---

### 4. Having one giant services folder

Bad:

```txt
services/
  product.service.ts
  order.service.ts
  customer.service.ts
  payment.service.ts
  user.service.ts
  report.service.ts
```

Better:

```txt
modules/products/server/product.service.ts
modules/orders/server/order.service.ts
modules/customers/server/customer.service.ts
modules/payments/server/payment.service.ts
```

Keep logic close to its module.

---

### 5. Mixing shared and module-specific logic

Bad:

```txt
shared/lib/calculateOrderTotal.ts
```

Better:

```txt
modules/orders/server/order-calculation.service.ts
```

Order calculation belongs to the order module.

---

## Recommended Rules for Agents / Developers

Follow these rules when adding or modifying features:

1. Keep route files thin.
2. Keep page files thin.
3. Do not put business logic inside React components.
4. Do not query Prisma directly from pages or components.
5. Use module services for business logic.
6. Use module repositories for database access.
7. Use schemas for validation.
8. Use Server Components by default.
9. Use Client Components only when interactivity is needed.
10. Use Server Actions for internal mutations.
11. Use Route Handlers for APIs and external access.
12. Put reusable UI in `shared/components`.
13. Put module-specific UI in `modules/{module}/components`.
14. Put global backend infrastructure in `server`.
15. Keep each module independent when possible.
16. Do not import one module's internal server files into another module unless necessary.
17. Prefer creating a shared service if multiple modules need the same cross-domain logic.
18. Keep tenant or branch filtering on the server side.
19. Validate all external input.
20. Keep naming consistent.

---

## Recommended Development Flow

When adding a new module, create this structure:

```txt
modules/example/
  components/
  server/
    example.service.ts
    example.repository.ts
  actions/
    example.actions.ts
  queries/
    example.queries.ts
  schemas/
    example.schema.ts
  types/
    example.types.ts
  constants.ts
```

Then create the route:

```txt
app/(dashboard)/example/page.tsx
```

If API access is needed:

```txt
app/api/example/route.ts
```

---

## Example: Adding a Customers Module

Folder:

```txt
modules/customers/
  components/
    CustomerTable.tsx
    CustomerForm.tsx

  server/
    customer.service.ts
    customer.repository.ts

  actions/
    customer.actions.ts

  queries/
    customer.queries.ts

  schemas/
    customer.schema.ts

  types/
    customer.types.ts
```

Page:

```tsx
// src/app/(dashboard)/customers/page.tsx

import { getCustomersQuery } from "@/modules/customers/queries/customer.queries";
import { CustomerTable } from "@/modules/customers/components/CustomerTable";

export default async function CustomersPage() {
  const customers = await getCustomersQuery();

  return <CustomerTable customers={customers} />;
}
```

Query:

```ts
// src/modules/customers/queries/customer.queries.ts

import { getCustomers } from "../server/customer.service";

export async function getCustomersQuery() {
  return getCustomers();
}
```

Service:

```ts
// src/modules/customers/server/customer.service.ts

import { customerRepository } from "./customer.repository";

export async function getCustomers() {
  return customerRepository.findMany();
}
```

Repository:

```ts
// src/modules/customers/server/customer.repository.ts

import { prisma } from "@/server/db/prisma";

export const customerRepository = {
  findMany() {
    return prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};
```

---

## Final Recommendation

For serious full-stack Next.js projects, use this structure:

```txt
src/
  app/
  modules/
  shared/
  server/
  middleware.ts

prisma/
  schema.prisma
```

Use `app` for routing.

Use `modules` for business features.

Use `shared` for reusable frontend/shared utilities.

Use `server` for global backend infrastructure.

This gives the project a clean separation between frontend, backend, and business domains while still taking advantage of Next.js full-stack capabilities.
