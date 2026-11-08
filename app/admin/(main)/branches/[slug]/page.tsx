import { BranchService } from "@/modules/branch/services/branch-service"
import { BranchStaffTab } from "@/modules/branch/components/branch-staff-tab"
import { BranchPerformanceTab } from "@/modules/branch/components/branch-performance-tab"
import { BranchWhatsappTab } from "@/modules/branch/components/branch-whatsapp-tab"
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
      <PageHeader
        title={`${branch.name}`}
        description="Kelola performa, staf, dan integrasi WhatsApp untuk cabang ini."
        backHref="/admin/branches"
        backLabel="Kembali ke Daftar Cabang"
      />

      <Tabs value={tab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="performance" asChild>
            <Link href={`/admin/branches/${slug}?tab=performance`} replace>Performa Cabang</Link>
          </TabsTrigger>
          <TabsTrigger value="staff" asChild>
            <Link href={`/admin/branches/${slug}?tab=staff`} replace>Staf Cabang</Link>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" asChild>
            <Link href={`/admin/branches/${slug}?tab=whatsapp`} replace>Integrasi WhatsApp</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4 pt-4">
          {tab === 'performance' ? <BranchPerformanceTab branchId={branch.id} /> : null}
        </TabsContent>

        <TabsContent value="staff" className="space-y-4 pt-4">
          {tab === 'staff' ? <BranchStaffTab branchId={branch.id} /> : null}
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4 pt-4">
          {tab === 'whatsapp' ? (
            <BranchWhatsappTab
              branchId={branch.id}
              branchName={branch.name}
              subdomain={branch.subdomain}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
