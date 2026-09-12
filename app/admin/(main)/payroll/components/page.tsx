import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { SalaryComponentService } from "@/modules/payroll/services/salary-component-service"
import { SalaryComponentTable } from "@/modules/payroll/components/salary-component-table"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Komponen Gaji | OKGO POS",
}

export default async function SalaryComponentsPage() {
  const rawComponents = await SalaryComponentService.getAll()
  
  // Convert Decimal to Number for Client Component
  const components = rawComponents.map(c => ({
    ...c,
    amount: c.amount ? Number(c.amount) : 0
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Komponen Gaji"
        description="Kelola master data tunjangan dan potongan untuk keperluan penggajian."
      />
      <SalaryComponentTable data={components} />
    </div>
  )
}
