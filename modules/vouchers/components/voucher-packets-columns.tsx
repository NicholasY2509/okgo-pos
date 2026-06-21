"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatIDR } from "@/lib/utils"
import Link from "next/link"

export type VoucherPacketTableData = {
  id: string
  name: string
  quantity: number
  price: any // It might come as a Decimal from server if not mapped, but we should handle it
  duration: number | null
  isActive: boolean
  productId: string
  product: {
    name: string
  }
}

export const voucherPacketsColumns: ColumnDef<VoucherPacketTableData>[] = [
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    accessorKey: "product.name",
    header: "Produk",
    cell: ({ row }) => (
      <Link href={`/admin/products/${row.original.productId}`} className="text-primary hover:underline">
        {row.original.product.name}
      </Link>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Kuantitas",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.quantity} Voucher</Badge>
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
    accessorKey: "duration",
    header: "Durasi",
    cell: ({ row }) => {
      const duration = row.original.duration
      return <div>{duration ? `${duration} Bulan` : "Tanpa Kadaluarsa"}</div>
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
