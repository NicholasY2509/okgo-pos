import { Metadata } from "next"
import { StaffService } from "@/modules/staff/services/staff-service"
import { WorkPositionService } from "@/modules/work-position/services/work-position-service"
import { BranchService } from "@/modules/branch/services/branch-service"
import { StaffTable } from "@/modules/staff/components/staff-table"
import { StaffDialog } from "@/modules/staff/components/staff-dialog"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Staff Management | OKGO POS",
  description: "Manage your staff members globally.",
}

export default async function StaffPage() {
  const [staff, workPositions, branches] = await Promise.all([
    StaffService.getAllStaff(),
    WorkPositionService.getAllWorkPositions(),
    BranchService.getAllBranches(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff Management"
        description="Manage your staff members globally."
      >
        <StaffDialog
          workPositions={workPositions.map(wp => ({ id: wp.id, name: wp.name }))}
          branches={branches.map(b => ({ id: b.id, name: b.name }))}
        />
      </PageHeader>

      <div className="w-full">
        <StaffTable data={staff} />
      </div>
    </div>
  )
}
