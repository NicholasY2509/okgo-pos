import { BranchService } from "@/modules/branch/services/branch-service"
import { AssignStaffForm } from "@/modules/branch/components/assign-staff-form"
import { RemoveStaffButton } from "@/modules/branch/components/remove-staff-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export async function BranchStaffTab({ branchId }: { branchId: string }) {
  const [staffs, roles, branchStaffs] = await Promise.all([
    BranchService.getAllStaffs(),
    BranchService.getAllRoles(),
    BranchService.getBranchStaffs(branchId)
  ])

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Staf Ditugaskan</CardTitle>
            <CardDescription>Staf yang memiliki akses ke cabang ini.</CardDescription>
          </CardHeader>
          <CardContent>
            {branchStaffs.length === 0 ? (
              <div className="text-muted-foreground text-sm py-4">Belum ada staf yang ditugaskan ke cabang ini.</div>
            ) : (
              <div className="space-y-4">
                {branchStaffs.map((bs) => (
                  <div key={bs.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{bs.staff.firstName} {bs.staff.lastName}</div>
                      <div className="text-sm text-muted-foreground">{bs.staff.workPosition.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {bs.role.name}
                      </div>
                      <RemoveStaffButton 
                        branchStaffId={bs.id} 
                        branchId={branchId} 
                        staffName={`${bs.staff.firstName} ${bs.staff.lastName}`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="w-96 shrink-0">
        <AssignStaffForm branchId={branchId} staffs={staffs} roles={roles} />
      </div>
    </div>
  )
}
