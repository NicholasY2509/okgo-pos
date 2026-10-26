import { PayrollUIService } from "@/modules/payroll/services/payroll-ui-service";
import { PayrollTable } from "@/modules/payroll/components/payroll-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Payroll Details | OKGO POS",
};

export default async function PayrollMonthDetailsPage({
  params,
}: {
  params: Promise<{ monthPeriod: string }>;
}) {
  const { monthPeriod } = await params;
  
  if (!monthPeriod || !/^\d{4}-\d{2}$/.test(monthPeriod)) {
    return notFound();
  }

  const payrolls = await PayrollUIService.getPayrollsByMonth(monthPeriod);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Detail Penggajian - ${monthPeriod}`}
        description="Lihat dan kelola detail slip gaji staf untuk bulan ini."
        backHref="/admin/payroll"
        backLabel="Kembali ke Penggajian"
      />

      <div className="w-full space-y-6">
        <PayrollTable data={payrolls} />
      </div>
    </div>
  );
}
