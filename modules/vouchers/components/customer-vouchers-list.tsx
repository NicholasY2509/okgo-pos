"use client"

import { DataTable } from "@/components/ui/data-table"
import { customerVouchersColumns, type CustomerVoucherData } from "./customer-vouchers-columns"

import { PageHeader } from "@/components/page-header"

interface CustomerVoucherListProps {
  data: CustomerVoucherData[]
}

export function CustomerVoucherList({ data }: CustomerVoucherListProps) {
  return (
    <DataTable columns={customerVouchersColumns} data={data} />
  )
}
