import { Metadata } from "next"
import { WorkPositionService } from "@/modules/work-position/services/work-position-service"
import { WorkPositionTable } from "@/modules/work-position/components/work-position-table"
import { WorkPositionDialog } from "@/modules/work-position/components/work-position-dialog"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Posisi Pekerjaan | OKGO POS",
  description: "Kelola posisi pekerjaan untuk staf Anda.",
}

export default async function WorkPositionsPage() {
  const positions = await WorkPositionService.getAllWorkPositions()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Posisi Pekerjaan"
        description="Kelola posisi pekerjaan untuk staf Anda."
      >
        <WorkPositionDialog />
      </PageHeader>

      <div className="w-full">
        <WorkPositionTable data={positions} />
      </div>
    </div>
  )
}
