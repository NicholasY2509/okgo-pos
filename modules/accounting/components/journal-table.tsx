"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { getJournalColumns } from "./journal-columns"

interface JournalTableProps {
  entries: any[]
  isAdmin?: boolean
  branchId?: string
}

export function JournalTable({ entries, isAdmin = false, branchId }: JournalTableProps) {
  const columns = useMemo(() => getJournalColumns(isAdmin, branchId), [isAdmin, branchId])

  return (
    <DataTable 
      columns={columns} 
      data={entries} 
      emptyMessage="Belum ada jurnal yang dicatat." 
    />
  )
}
