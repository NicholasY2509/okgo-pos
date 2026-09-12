import { Metadata } from "next"
import { AttendanceStatusService } from "@/modules/attendance-status/services/attendance-status-service"
import { AttendanceStatusTable } from "@/modules/attendance-status/components/attendance-status-table"
import { AttendanceStatusDialog } from "@/modules/attendance-status/components/attendance-status-dialog"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Master Status Absensi | OKGO POS",
}

export default async function AttendanceStatusesPage() {
  const rawStatuses = await AttendanceStatusService.getAll()

  // Convert Prisma Decimal objects to simple numbers for the client component
  const statuses = rawStatuses.map(status => ({
    ...status,
    penaltyAmount: status.penaltyAmount ? Number(status.penaltyAmount) : 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Master Status Absensi"
        description="Kelola berbagai kode status yang digunakan dalam pencatatan absensi harian."
      >
        <AttendanceStatusDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Status
          </Button>
        </AttendanceStatusDialog>
      </PageHeader>

      <AttendanceStatusTable data={statuses} />
    </div>
  )
}
