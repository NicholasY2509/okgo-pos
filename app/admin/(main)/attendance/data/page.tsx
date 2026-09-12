import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { AttendanceService } from "@/modules/attendance/services/attendance-service"
import { AttendanceDataClient } from "@/modules/attendance/components/attendance-data-client"
import { AttendanceStatusService } from "@/modules/attendance-status/services/attendance-status-service"
import { AttendanceCalculatorDialog } from "@/modules/attendance/components/attendance-calculator-dialog"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Data Kehadiran | OKGO POS",
}

interface AttendanceDataPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AttendanceDataPage({ searchParams }: AttendanceDataPageProps) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? Number(params.page) : 1;
  const limit = typeof params.limit === 'string' ? Number(params.limit) : 10;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const startDateStr = typeof params.startDate === 'string' ? params.startDate : undefined;
  const endDateStr = typeof params.endDate === 'string' ? params.endDate : undefined;
  const statusId = typeof params.statusId === 'string' ? params.statusId : undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = startDateStr ? new Date(startDateStr) : today;
  let endDate = endDateStr ? new Date(endDateStr) : new Date(today);
  endDate.setHours(23, 59, 59, 999);

  const data = await AttendanceService.getAttendances({ page, limit, search, startDate, endDate, statusId })
  const rawStatuses = await AttendanceStatusService.getAll()

  // Cast Decimal to Number for Client Component
  const statuses = rawStatuses.map(status => ({
    ...status,
    penaltyAmount: status.penaltyAmount ? Number(status.penaltyAmount) : 0
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Kehadiran"
        description="Pusat data absensi harian yang sudah diolah dari log mesin absensi."
      >
        <AttendanceCalculatorDialog />
      </PageHeader>

      <AttendanceDataClient data={data} statuses={statuses} />
    </div>
  )
}
