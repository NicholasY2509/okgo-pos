import { PageHeader } from "@/components/page-header"
import { CustomerVoucherService } from "@/modules/vouchers/services/customer-voucher-service"
import { CustomerVoucherList } from "@/modules/vouchers/components/customer-vouchers-list"

export const metadata = {
  title: "Voucher Terbit | Admin",
}

export default async function IssuedVouchersPage() {
  const customerVouchers = await CustomerVoucherService.getAll()

  // Map to safely extract properties
  const safeData = customerVouchers.map(cv => ({
    ...cv,
    initialCreditAmount: cv.initialCreditAmount ? Number(cv.initialCreditAmount) : null,
    remainingCreditAmount: cv.remainingCreditAmount ? Number(cv.remainingCreditAmount) : null,
  })) as any;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Daftar Voucher"
        description="Lihat semua voucher yang telah diberikan kepada pelanggan beserta statusnya."
      />

      <CustomerVoucherList data={safeData} />
    </div>
  )
}
