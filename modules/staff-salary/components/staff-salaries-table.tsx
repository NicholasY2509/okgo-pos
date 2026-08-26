"use client"

import { DataTable } from "@/components/ui/data-table"
import { staffSalariesColumns, StaffSalaryTableData } from "./staff-salaries-columns"

interface StaffSalariesTableProps {
  data: StaffSalaryTableData[]
}

export function StaffSalariesTable({ data }: StaffSalariesTableProps) {
  return (
    <DataTable
      columns={staffSalariesColumns}
      data={data}
    />
  )
}
