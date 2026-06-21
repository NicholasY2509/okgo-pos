"use client"

import { DataTable } from "@/components/ui/data-table"
import { staffColumns, type StaffData } from "./staff-columns"

interface StaffTableProps {
  data: StaffData[]
}

export function StaffTable({ data }: StaffTableProps) {
  return <DataTable columns={staffColumns} data={data} emptyMessage="Tidak ada staf yang ditemukan." />
}
