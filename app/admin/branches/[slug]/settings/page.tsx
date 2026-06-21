import { BranchService } from "@/modules/branch/services/branch-service"
import { AssignUserForm } from "@/modules/branch/components/assign-user-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function BranchSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const branch = await BranchService.getBranchBySubdomain(slug)

  if (!branch) {
    notFound()
  }

  const [users, roles, branchUsers] = await Promise.all([
    BranchService.getAllUsers(),
    BranchService.getAllRoles(),
    BranchService.getBranchUsers(branch.id)
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/branches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Pengaturan Cabang: {branch.name}</h1>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengguna Ditugaskan</CardTitle>
              <CardDescription>Pengguna yang memiliki akses ke cabang ini.</CardDescription>
            </CardHeader>
            <CardContent>
              {branchUsers.length === 0 ? (
                <div className="text-muted-foreground text-sm py-4">Belum ada pengguna yang ditugaskan ke cabang ini.</div>
              ) : (
                <div className="space-y-4">
                  {branchUsers.map((bu) => (
                    <div key={bu.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <div className="font-medium">{bu.user.name || bu.user.email}</div>
                        <div className="text-sm text-muted-foreground">{bu.user.email}</div>
                      </div>
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {bu.role.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-96 shrink-0">
          <AssignUserForm branchId={branch.id} users={users} roles={roles} />
        </div>
      </div>
    </div>
  )
}
