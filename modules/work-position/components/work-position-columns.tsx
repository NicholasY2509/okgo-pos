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
    header: "Nama Posisi",
  },
  {
    accessorKey: "description",
    header: "Deskripsi",
    cell: ({ row }) => row.original.description || "-",
  },
  {
    id: "staffCount",
    header: "Jumlah Staf",
    cell: ({ row }) => row.original._count.staff,
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Pada",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
]
