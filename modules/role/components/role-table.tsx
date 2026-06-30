"use client"

import { DataTable } from "@/components/ui/data-table"
import { roleColumns, type RoleData } from "./role-columns"

interface RoleTableProps {
  data: RoleData[]
}

export function RoleTable({ data }: RoleTableProps) {
  return <DataTable columns={roleColumns} data={data} emptyMessage="Tidak ada role yang ditemukan." />
}
