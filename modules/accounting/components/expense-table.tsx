"use client"

import { DataTable } from "@/components/ui/data-table"
import { getExpenseColumns } from "./expense-columns"

interface ExpenseTableProps {
  entries: any[]
  isAdmin: boolean
  branchId?: string
}

export function ExpenseTable({ entries, isAdmin, branchId }: ExpenseTableProps) {
  const columns = getExpenseColumns(isAdmin, branchId)

  return (
    <DataTable
      columns={columns}
      data={entries}
    />
  )
}
