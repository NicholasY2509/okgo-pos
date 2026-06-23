"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export type CustomerVoucherData = {
  id: string
  code: string
  status: string
  expiresAt: Date | null
  initialVisitCount: number | null
  remainingVisitCount: number | null
  initialCreditAmount: any | null
  remainingCreditAmount: any | null
  customer: {
    id: string
    name: string
  }
  voucherPacket: {
    id: string
    name: string
  }
}

export const customerVouchersColumns: ColumnDef<CustomerVoucherData>[] = [
  {
    accessorKey: "code",
    header: "Kode Voucher",
    cell: ({ row }) => <span className="font-mono font-medium">{row.original.code}</span>
  },
  {
    accessorKey: "customer.name",
    header: "Pelanggan",
  },
  {
    accessorKey: "voucherPacket.name",
    header: "Paket",
  },
  {
    id: "balance",
    header: "Sisa Kuota",
    cell: ({ row }) => {
      const data = row.original;
      if (data.remainingVisitCount != null) {
        return <span>{data.remainingVisitCount} Kunjungan</span>
      } else if (data.remainingCreditAmount != null) {
        return <span>Rp {Number(data.remainingCreditAmount).toLocaleString('id-ID')}</span>
      }
      return <span className="text-muted-foreground">-</span>
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      if (status === "ACTIVE") return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
      if (status === "USED_UP") return <Badge variant="secondary">Habis</Badge>
      if (status === "EXPIRED") return <Badge variant="destructive">Kedaluwarsa</Badge>
      if (status === "VOID") return <Badge variant="destructive">Dibatalkan</Badge>
      return <Badge variant="outline">{status}</Badge>
    }
  },
  {
    accessorKey: "expiresAt",
    header: "Kedaluwarsa",
    cell: ({ row }) => {
      const date = row.original.expiresAt
      return date ? format(new Date(date), "dd MMM yyyy") : <span className="text-muted-foreground">Tidak Ada</span>
    }
  }
]
