import { PayrollUIService } from "@/modules/payroll/services/payroll-ui-service";
import { PayrollMonthTable } from "@/modules/payroll/components/payroll-month-table";
import { GeneratePayrollDialog } from "@/modules/payroll/components/generate-payroll-dialog";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Payroll Management | OKGO POS",
};

export default async function PayrollPage() {
  const summary = await PayrollUIService.getPayrollSummaryByMonth();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Penggajian (Payroll)"
        description="Kelola laporan penggajian staf per bulan."
      >
        <div className="flex gap-2">
          <GeneratePayrollDialog />
        </div>
      </PageHeader>

      <div className="w-full space-y-6">
        <PayrollMonthTable data={summary} />
      </div>
    </div>
  );
}
