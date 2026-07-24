import { BranchService } from "@/modules/branch/services/branch-service"
import { BranchDialog } from "@/modules/branch/components/branch-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Users, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { PageHeader } from "@/components/page-header"

export const dynamic = "force-dynamic"

export default async function BranchesPage() {
  const branches = await BranchService.getAllBranches()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cabang"
        description="Kelola semua lokasi toko dan akses penyewa Anda."
      >
        <BranchDialog />
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <Card key={branch.id} className="flex flex-col hover:shadow-md transition-all duration-200 overflow-hidden">
            <CardHeader className="pb-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-semibold">{branch.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1 text-primary font-medium">
                    {branch.subdomain}.nyenyak.com
                  </CardDescription>
                </div>
                <Badge variant={branch.isActive ? "default" : "secondary"} className="font-normal text-xs">
                  {branch.isActive ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <span className="leading-snug">{branch.address || "Tidak ada alamat"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                <span>{branch.phone || "Tidak ada telepon"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 shrink-0 text-gray-400" />
                <span>{branch._count.branchStaffs} Staf Ditugaskan</span>
              </div>
            </CardContent>
            <CardFooter className="border-t flex justify-between gap-2">
              <BranchDialog initialData={branch} />
              <div className="flex gap-2">
                <Link href={`http://${branch.subdomain}.localhost:3000/pos`} target="_blank">
                  <Button variant="outline" size="sm" className="h-8 shadow-sm">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Kunjungi
                  </Button>
                </Link>
                <Link href={`/branches/${branch.subdomain}`}>
                  <Button variant="default" size="sm" className="h-8 shadow-sm">Kelola</Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        ))}
        {branches.length === 0 && (
          <div className="col-span-full p-12 text-center border border-dashed rounded-xl">
            <h3 className="text-lg font-medium ">Cabang tidak ditemukan</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Buat lokasi cabang pertama Anda untuk memulai.</p>
            <BranchDialog />
          </div>
        )}
      </div>
    </div>
  )
}
