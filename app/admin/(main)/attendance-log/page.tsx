import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/ui/data-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { columns } from "@/modules/attendance-log/components/columns"
import { AttendanceLogService } from "@/modules/attendance-log/services/attendance-log-service"
import { BranchService } from "@/modules/branch/services/branch-service"
import { AttendanceLogFilters } from "@/modules/attendance-log/components/attendance-log-filters"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Log Absensi Mesin | OKGO POS",
  description: "Riwayat raw log absensi dari mesin sidik jari/wajah.",
}

interface AttendanceLogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AttendanceLogPage({ searchParams }: AttendanceLogPageProps) {
  const params = await searchParams;

  const page = typeof params.page === 'string' ? Number(params.page) : 1;
  const limit = typeof params.limit === 'string' ? Number(params.limit) : 10;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const branchId = typeof params.branchId === 'string' ? params.branchId : undefined;
  const state = typeof params.state === 'string' ? Number(params.state) : undefined;

  const [logsData, branches] = await Promise.all([
    AttendanceLogService.getLogs({ page, limit, search, branchId, state }),
    BranchService.getAllBranches()
  ])

  const mappedBranches = branches.map(b => ({ id: b.id, name: b.name }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Log Absensi Mesin"
        description="Melihat riwayat mentah (raw logs) pengiriman absen dari mesin ke sistem."
      />

      <AttendanceLogFilters branches={mappedBranches} />
      <DataTable columns={columns} data={logsData.logs} emptyMessage="Belum ada log absensi yang masuk." />
      <DataTablePagination metadata={logsData.metadata} />

    </div>
  )
}
