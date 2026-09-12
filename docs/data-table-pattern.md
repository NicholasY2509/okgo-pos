# Okgo POS - Data Table Architecture Blueprint

This document outlines the standard pattern for building and rendering data tables in the Okgo POS application. Following this blueprint ensures that the codebase remains consistent, clean, and easy to maintain.

## The Pattern: Server Page ➡️ Wrapper Component ➡️ Columns & DataTable

Every data table implementation must be separated into three distinct layers to properly separate server-side data fetching from client-side state and rendering logic.

### 1. The Columns Definition (`modules/[name]/components/[feature]-columns.tsx`)
Defines the `ColumnDef` array for the table. It handles formatting, relations, and row-level actions (like Edit/Delete buttons or Dropdowns).

**Rules:**
- Must contain `"use client"`.
- Must export the type of data the table expects (if not already defined in Prisma or schemas).
- Export the columns as an array or a function returning an array (if dependencies like `categories` are needed).

```tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type FeatureData = {
  id: string
  name: string
  isActive: boolean
}

export const featureColumns: ColumnDef<FeatureData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Button variant="ghost" size="sm">Edit</Button>
      )
    }
  }
]
```

---

### 2. The Table Wrapper (`modules/[name]/components/[feature]-table.tsx`)
A client-side wrapper component that receives the data, holds any table-specific state (like filtering or sorting if needed), and renders the shared `DataTable` component.

**Rules:**
- Must contain `"use client"`.
- Must import and use the columns defined in the `[feature]-columns.tsx` file.
- Should provide a contextual `emptyMessage` to the `<DataTable />`.
- Can handle "Empty States" if complex UI is needed when no data is present (e.g. showing a creation dialog).

```tsx
"use client"

import { DataTable } from "@/components/ui/data-table"
import { featureColumns, type FeatureData } from "./feature-columns"

interface FeatureTableProps {
  data: FeatureData[]
}

export function FeatureTable({ data }: FeatureTableProps) {
  // If you need complex empty states, handle them here:
  if (data.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed rounded-xl bg-card">
        <h3 className="text-lg font-medium">No features found</h3>
      </div>
    )
  }

  return (
    <DataTable 
      columns={featureColumns} 
      data={data} 
      emptyMessage="No features found." 
    />
  )
}
```

---

### 3. The Server Page (`app/[route]/page.tsx`)
The page where the table is rendered. This is a Server Component responsible *only* for data fetching and passing the data to the Wrapper Component.

**Rules:**
- Must be an async server component.
- Must NOT import `@/components/ui/data-table` or the `columns` directly.
- Only imports the Wrapper Component (`FeatureTable`).

```tsx
import { FeatureService } from "@/modules/feature/services/feature-service"
import { FeatureTable } from "@/modules/feature/components/feature-table"
import { PageHeader } from "@/components/page-header"

export default async function FeaturePage() {
  // 1. Fetch data on the server
  const features = await FeatureService.getAll()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Features"
        description="Manage all features."
      />

      {/* 2. Pass data to the Client Wrapper */}
      <FeatureTable data={features} />
    </div>
  )
}
```

## Why this Pattern?
1. **Clean Server Components:** Keep server pages focused on data fetching.
2. **Client-Side Isolation:** Tables often require client-side hooks (`useReactTable`, sorting, pagination). The Wrapper Component isolates this client boundary.
3. **Column Cleanliness:** `ColumnDef` arrays get extremely large due to custom cell rendering. Separating them into their own file keeps the wrapper component highly readable.
