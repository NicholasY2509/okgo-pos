import { BranchService } from "@/modules/branch/services/branch-service"
import { StaffService } from "@/modules/staff/services/staff-service"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { BranchHrisClient } from "@/modules/staff/components/branch-hris-client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar } from "lucide-react"

export default async function TenantHRISPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params
  const branch = await BranchService.getBranchBySubdomain(tenant)
  if (!branch) {
    notFound()
  }

  const staffList = await StaffService.getBranchHrisRoster(branch.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sumber Daya Manusia (HRIS)"
        description={`Daftar karyawan, posisi, status aktivitas kerja, dan rekap kehadiran cabang ${branch.name}.`}
      >
        <Button variant="outline" asChild>
          <Link href="/hris/attendance">
            <Calendar className="mr-2 h-4 w-4" />
            Jadwal Kerja
          </Link>
        </Button>
      </PageHeader>

      <BranchHrisClient
        branchName={branch.name}
        branchSubdomain={tenant}
        staffList={staffList}
      />
    </div>
  )
}
