import { Metadata } from "next"
import { AttendanceMachineService } from "@/modules/attendance-machine/services/attendance-machine-service"
import { BranchService } from "@/modules/branch/services/branch-service"
import { PageHeader } from "@/components/page-header"
import { MachineTable } from "@/modules/attendance-machine/components/machine-table"
import { MachineDialog } from "@/modules/attendance-machine/components/machine-dialog"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Master Mesin Absensi | OKGO POS",
  description: "Kelola data mesin absensi per cabang.",
}

export default async function AttendanceMachinesPage() {
  const [machines, branches] = await Promise.all([
    AttendanceMachineService.getAll(),
    BranchService.getAllBranches(),
  ])

  const mappedBranches = branches.map(b => ({ id: b.id, name: b.name }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Master Mesin Absensi"
        description="Kelola pendaftaran mesin absensi dan pemetaannya ke masing-masing cabang."
      >
        <MachineDialog branches={mappedBranches} />
      </PageHeader>

      <MachineTable data={machines} branches={mappedBranches} />
    </div>
  )
}
