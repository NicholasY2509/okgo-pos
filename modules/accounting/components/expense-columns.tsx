"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { formatIDR } from "@/lib/utils"

export const getExpenseColumns = (isAdmin: boolean, branchId?: string): ColumnDef<any>[] => [
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
    header: "Deskripsi / Jurnal No.",
    cell: ({ row }) => {
      const entry = row.original
      return (
        <div>
          <div className="font-medium">{entry.description}</div>
          <div className="text-xs text-muted-foreground font-mono mt-1">
            {entry.journalNumber || "-"}
            {entry.reference && <span className="ml-2 pl-2 border-l border-muted">Ref: {entry.reference}</span>}
          </div>
        </div>
      )
    }
  },
  {
    id: "expenseAccount",
    header: "Akun Beban",
    cell: ({ row }) => {
      const entry = row.original
      const expenseLine = entry.lines.find((l: any) => l.ledgerAccount.type === 'EXPENSE')
      return (
        <div className="text-sm font-medium">
          {expenseLine ? expenseLine.ledgerAccount.name : "-"}
        </div>
      )
    }
  },
  {
    id: "paymentAccount",
    header: "Dibayar Dari",
    cell: ({ row }) => {
      const entry = row.original
      const paymentLine = entry.lines.find((l: any) => l.ledgerAccount.type !== 'EXPENSE')
      return (
        <div className="text-sm text-muted-foreground">
          {paymentLine ? paymentLine.ledgerAccount.name : "-"}
        </div>
      )
    }
  },
  {
    id: "amount",
    header: () => <div className="text-right">Jumlah</div>,
    cell: ({ row }) => {
      const entry = row.original
      const expenseLine = entry.lines.find((l: any) => l.ledgerAccount.type === 'EXPENSE')
      return (
        <div className="text-right font-medium">
          {formatIDR(Number(expenseLine?.debit || 0))}
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
