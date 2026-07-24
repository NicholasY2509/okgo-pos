import { VoucherPacketService } from "@/modules/vouchers/services/voucher-packet-service"
import { PageHeader } from "@/components/page-header"
import { VoucherPacketsTable } from "@/modules/vouchers/components/voucher-packets-table"

export default async function VouchersPage() {
  const rawVoucherPackets = await VoucherPacketService.getAll()

  const voucherPackets = rawVoucherPackets.map(packet => ({
    ...packet,
    price: Number(packet.price),
    totalCreditAmount: packet.totalCreditAmount ? Number(packet.totalCreditAmount) : null,
    product: packet.product ? {
      ...packet.product,
      price: Number(packet.product.price)
    } : null
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Paket Voucher"
        description="Kelola dan lihat semua paket voucher di seluruh produk Anda."
      />

      <VoucherPacketsTable data={voucherPackets} />
    </div>
  )
}
