import { BranchService } from "@/modules/branch/services/branch-service"
import { BranchStaffTab } from "@/modules/branch/components/branch-staff-tab"
import { BranchPerformanceTab } from "@/modules/branch/components/branch-performance-tab"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft, ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function BranchSettingsPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const tab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'performance'

  const branch = await BranchService.getBranchBySubdomain(slug)

  if (!branch) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/branches" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Kembali ke Daftar Cabang
      </Link>

      <PageHeader
        title={`${branch.name}`}
        description="Kelola performa dan staf untuk cabang ini."
      />

      <Tabs value={tab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="performance" asChild>
            <Link href={`/admin/branches/${slug}?tab=performance`} replace>Performa Cabang</Link>
          </TabsTrigger>
          <TabsTrigger value="staff" asChild>
            <Link href={`/admin/branches/${slug}?tab=staff`} replace>Staf Cabang</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4 pt-4">
          {tab === 'performance' ? <BranchPerformanceTab branchId={branch.id} /> : null}
        </TabsContent>

        <TabsContent value="staff" className="space-y-4 pt-4">
          {tab === 'staff' ? <BranchStaffTab branchId={branch.id} /> : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
