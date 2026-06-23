"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatIDR } from "@/lib/utils"
import Link from "next/link"

export type VoucherPacketTableData = {
  id: string
  name: string
  codeSuffix: string | null
  price: any 
  totalVisitCount: number | null
  totalCreditAmount: any
  validityDays: number | null
  isActive: boolean
  productId: string | null
  product: {
    name: string
  } | null
}

export const voucherPacketsColumns: ColumnDef<VoucherPacketTableData>[] = [
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    accessorKey: "codeSuffix",
    header: "Suffix",
    cell: ({ row }) => (
      row.original.codeSuffix ? <Badge variant="outline">{row.original.codeSuffix}</Badge> : "-"
    ),
  },
  {
    accessorKey: "product.name",
    header: "Produk",
    cell: ({ row }) => (
      row.original.productId && row.original.product ? (
        <Link href={`/admin/products/${row.original.productId}`} className="text-primary hover:underline">
          {row.original.product.name}
        </Link>
      ) : "-"
    ),
  },
  {
    accessorKey: "price",
    header: "Harga",
    cell: ({ row }) => {
      const amount = Number(row.original.price)
      return <div className="font-medium">{formatIDR(amount)}</div>
    },
  },
  {
    accessorKey: "details",
    header: "Detail",
    cell: ({ row }) => {
      const { totalVisitCount, totalCreditAmount } = row.original
      if (totalVisitCount) return <div>{totalVisitCount} Kunjungan</div>
      if (totalCreditAmount) return <div>Kredit {formatIDR(Number(totalCreditAmount))}</div>
      return "-"
    },
  },
  {
    accessorKey: "validityDays",
    header: "Masa Berlaku",
    cell: ({ row }) => {
      const duration = row.original.validityDays
      return <div>{duration ? `${duration} Hari` : "Tanpa Kadaluarsa"}</div>
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Aktif" : "Tidak Aktif"}
      </Badge>
    ),
  },
]
