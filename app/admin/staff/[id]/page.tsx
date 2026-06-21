import { Metadata } from "next"
import { notFound } from "next/navigation"
import { StaffService } from "@/modules/staff/services/staff-service"
import { UserService } from "@/modules/staff-user/services/user-service"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Briefcase } from "lucide-react"
import { AssignUserDialog } from "@/modules/staff-user/components/assign-user-dialog"
import { UnlinkUserButton } from "@/modules/staff-user/components/unlink-user-button"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Detail Staf | OKGO POS",
}

export default async function StaffDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const [staff, allUsers] = await Promise.all([
    StaffService.getStaffById(params.id),
    UserService.getAllUsers()
  ])

  if (!staff) {
    notFound()
  }

  const linkedUsers = staff.staffUsers || []
  const linkedUserIds = linkedUsers.map(su => su.user.id)
  const availableUsers = allUsers.filter(u => !linkedUserIds.includes(u.id))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${staff.firstName} ${staff.lastName}`}
        description="Lihat dan kelola detail serta akses staf."
      >
        <Badge variant={staff.isActive ? "default" : "secondary"} className="ml-2">
          {staff.isActive ? "Aktif" : "Tidak Aktif"}
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informasi Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-medium">Posisi:</span> {staff.workPosition.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-medium">Cabang:</span> {staff.branch?.name || "Global"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-medium">Email:</span> {staff.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-medium">Telepon:</span> {staff.phone || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Akun Pengguna Tertaut</CardTitle>
              <CardDescription>Akun yang dapat masuk sebagai staf ini.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {linkedUsers.length > 0 ? (
              <div className="space-y-3">
                {linkedUsers.map(({ user }) => (
                  <Card key={user.id} className="">
                    <CardContent className="flex flex-row justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none">{user.name || "Pengguna Tanpa Nama"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                        </div>
                      </div>
                      <UnlinkUserButton staffId={staff.id} userId={user.id} />
                    </CardContent>

                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Tidak ada akun pengguna yang tertaut.
              </div>
            )}

            {linkedUsers.length === 0 && (
              <div className="mt-6">
                <AssignUserDialog staffId={staff.id} users={availableUsers} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
