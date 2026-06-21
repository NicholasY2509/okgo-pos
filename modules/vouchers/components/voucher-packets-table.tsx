"use client"

import { DataTable } from "@/components/ui/data-table"
import { voucherPacketsColumns, type VoucherPacketTableData } from "./voucher-packets-columns"

interface VoucherPacketsTableProps {
  data: VoucherPacketTableData[]
}

export function VoucherPacketsTable({ data }: VoucherPacketsTableProps) {
  if (data.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed rounded-xl bg-card">
        <h3 className="text-lg font-medium">Paket voucher tidak ditemukan</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Belum ada paket voucher yang dibuat. Buat paket dari halaman detail produk.
        </p>
      </div>
    )
  }

  return (
    <DataTable
      columns={voucherPacketsColumns}
      data={data}
      emptyMessage="Paket voucher tidak ditemukan."
    />
  )
}
