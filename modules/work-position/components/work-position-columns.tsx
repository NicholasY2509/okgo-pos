"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatDate } from "@/lib/utils"

export type WorkPositionData = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  _count: {
    staff: number
  }
}

export const workPositionColumns: ColumnDef<WorkPositionData>[] = [
  {
    accessorKey: "name",
    header: "Position Name",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description || "-",
  },
  {
    id: "staffCount",
    header: "Staff Count",
    cell: ({ row }) => row.original._count.staff,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
]
