"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export const getJournalColumns = (isAdmin: boolean, branchId?: string): ColumnDef<any>[] => [
  {
    accessorKey: "date",
    header: "Tanggal",
    cell: ({ row }) => {
      const entry = row.original
      return (
        <div className="text-sm">
          {format(new Date(entry.date), "dd MMM yyyy")}
          {isAdmin && entry.branchId && (
            <div className="text-xs text-muted-foreground font-mono mt-1">Cabang: {entry.branchId}</div>
          )}
        </div>
      )
    }
  },
  {
    accessorKey: "description",
    header: "Deskripsi / Ref",
    cell: ({ row }) => {
      const entry = row.original
      return (
        <div>
          <div className="font-medium">{entry.description}</div>
          {entry.reference && <div className="text-xs text-muted-foreground font-mono">{entry.reference}</div>}
        </div>
      )
    }
  },
  {
    id: "totalDebit",
    header: () => <div className="text-right">Total Debit</div>,
    cell: ({ row }) => {
      const entry = row.original
      const totalDebit = entry.lines.reduce((acc: number, line: any) => acc + Number(line.debit), 0)
      return (
        <div className="text-right font-medium">
          {totalDebit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
        </div>
      )
    }
  },
  {
    id: "totalCredit",
    header: () => <div className="text-right">Total Kredit</div>,
    cell: ({ row }) => {
      const entry = row.original
      const totalCredit = entry.lines.reduce((acc: number, line: any) => acc + Number(line.credit), 0)
      return (
        <div className="text-right font-medium">
          {totalCredit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
        </div>
      )
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-4">Aksi</div>,
    cell: ({ row }) => {
      const entry = row.original
      const href = isAdmin 
        ? `/admin/accounting/journal/${entry.id}` 
        : `/${branchId}/accounting/journal/${entry.id}`
      return (
        <div className="text-right">
          <Button variant="ghost" size="sm" asChild>
            <Link href={href}>
              <Eye className="w-4 h-4 mr-2" />
              Detail
            </Link>
          </Button>
        </div>
      )
    }
  }
]
