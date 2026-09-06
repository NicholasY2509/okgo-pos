"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatIDR } from "@/lib/utils"
import Link from "next/link"
import { MoreHorizontal, Edit, Trash, CopyPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { VoucherPacketDialog } from "./voucher-packet-dialog"
import { GenerateVouchersDialog } from "./generate-vouchers-dialog"
import { useVoucherPacket } from "../hooks/use-voucher-packet"

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
  cashierIncentiveType: string | null
  cashierIncentiveAmount: any
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
    accessorKey: "cashierIncentiveAmount",
    header: "Insentif",
    cell: ({ row }) => {
      const type = row.original.cashierIncentiveType;
      const amount = Number(row.original.cashierIncentiveAmount);
      if (!amount) return "-";
      return <div>{type === "PERCENTAGE" ? `${amount}%` : formatIDR(amount)}</div>;
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
  {
    id: "actions",
    cell: ({ row }) => {
      return <ActionsCell packet={row.original} />
    },
  },
]

function ActionsCell({ packet }: { packet: VoucherPacketTableData }) {
  const router = useRouter()
  const { onDelete } = useVoucherPacket({ onSuccess: () => router.refresh() })

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <GenerateVouchersDialog
            packetId={packet.id}
            onSuccess={() => router.refresh()}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <CopyPlus className="mr-2 h-4 w-4" />
                Generate Vouchers
              </DropdownMenuItem>
            }
          />

          <VoucherPacketDialog
            initialData={packet as any}
            onSuccess={() => router.refresh()}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin menghapus paket voucher ini?")) {
                onDelete(packet.id)
              }
            }}
          >
            <Trash className="mr-2 h-4 w-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
