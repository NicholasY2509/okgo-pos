import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { AttendanceService } from "@/modules/attendance/services/attendance-service"
import { AttendanceTable } from "@/modules/attendance/components/attendance-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Card, CardContent } from "@/components/ui/card"

import { AttendanceFilters } from "@/modules/attendance/components/attendance-filters"
import { AttendanceStatusService } from "@/modules/attendance-status/services/attendance-status-service"

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

  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  const data = await AttendanceService.getAttendances({ page, limit, search, startDate, endDate, statusId })
  const statuses = await AttendanceStatusService.getAll()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Kehadiran"
        description="Pusat data absensi harian yang sudah diolah dari log mesin absensi."
      />

      <AttendanceFilters statuses={statuses} />
      <AttendanceTable data={data.attendances} />
      <DataTablePagination metadata={data.metadata} />
    </div>
  )
}
