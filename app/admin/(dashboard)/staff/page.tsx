import { Metadata } from "next"
import { StaffService } from "@/modules/staff/services/staff-service"
import { WorkPositionService } from "@/modules/work-position/services/work-position-service"
import { BranchService } from "@/modules/branch/services/branch-service"
import { StaffTable } from "@/modules/staff/components/staff-table"
import { StaffDialog } from "@/modules/staff/components/staff-dialog"
import { StaffFilters } from "@/modules/staff/components/staff-filters"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { PageHeader } from "@/components/page-header"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Manajemen Staf | OKGO POS",
  description: "Kelola anggota staf Anda secara global.",
}

interface StaffPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? Number(params.page) : 1;
  const limit = typeof params.limit === 'string' ? Number(params.limit) : 10;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const branchId = typeof params.branchId === 'string' ? params.branchId : undefined;

  const [staffData, workPositions, branches] = await Promise.all([
    StaffService.getAllStaffPaginated({ page, limit, search, branchId }),
    WorkPositionService.getAllWorkPositions(),
    BranchService.getAllBranches(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manajemen Staf"
        description="Kelola anggota staf Anda secara global."
      >
        <StaffDialog
          workPositions={workPositions.map(wp => ({ id: wp.id, name: wp.name }))}
        />
      </PageHeader>

      <div className="w-full space-y-6">
        <StaffFilters branches={branches} />
        <StaffTable data={staffData.staff} />
        <DataTablePagination metadata={staffData.metadata} />
      </div>
    </div>
  )
}
