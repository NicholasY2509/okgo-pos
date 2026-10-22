import { BranchService } from "@/modules/branch/services/branch-service"
import { AssignStaffForm } from "@/modules/branch/components/assign-staff-form"
import { RemoveStaffButton } from "@/modules/branch/components/remove-staff-button"
import { BulkAssignStaffDialog } from "@/modules/branch/components/bulk-assign-staff-dialog"
import { TransferStaffDialog } from "@/modules/branch/components/transfer-staff-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export async function BranchStaffTab({ branchId }: { branchId: string }) {
  const [staffs, roles, branchStaffs, allBranches] = await Promise.all([
    BranchService.getAllStaffs(),
    BranchService.getAllRoles(),
    BranchService.getBranchStaffs(branchId),
    BranchService.getAllBranches(),
  ])

  const currentBranch = allBranches.find((b) => b.id === branchId)
  const currentBranchName = currentBranch?.name || "Cabang Ini"

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Staf Ditugaskan ({branchStaffs.length})</CardTitle>
              <CardDescription>Staf yang saat ini memiliki akses aktif ke cabang ini.</CardDescription>
            </div>
            <BulkAssignStaffDialog
              branchId={branchId}
              branchName={currentBranchName}
              staffs={staffs}
              roles={roles}
            />
          </CardHeader>
          <CardContent>
            {branchStaffs.length === 0 ? (
              <div className="text-muted-foreground text-sm py-8 text-center">
                Belum ada staf yang ditugaskan ke cabang ini. Gunakan tombol di atas atau form di samping untuk menugaskan staf.
              </div>
            ) : (
              <div className="space-y-3">
                {branchStaffs.map((bs) => (
                  <div
                    key={bs.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3.5 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {bs.staff.firstName} {bs.staff.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {bs.staff.workPosition?.name || "Tanpa Posisi"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TransferStaffDialog
                        staffId={bs.staff.id}
                        staffName={`${bs.staff.firstName} ${bs.staff.lastName}`}
                        currentBranchId={branchId}
                        currentBranchName={currentBranchName}
                        currentRoleId={bs.role.id}
                        branches={allBranches}
                        roles={roles}
                        defaultMode="role"
                        trigger={
                          <button
                            type="button"
                            className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer"
                            title="Klik untuk ubah peran"
                          >
                            {bs.role.name}
                          </button>
                        }
                      />
                      <TransferStaffDialog
                        staffId={bs.staff.id}
                        staffName={`${bs.staff.firstName} ${bs.staff.lastName}`}
                        currentBranchId={branchId}
                        currentBranchName={currentBranchName}
                        currentRoleId={bs.role.id}
                        branches={allBranches}
                        roles={roles}
                        defaultMode="transfer"
                      />
                      <RemoveStaffButton
                        branchStaffId={bs.id}
                        branchId={branchId}
                        staffId={bs.staff.id}
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

      <div className="w-full lg:w-96 shrink-0">
        <AssignStaffForm branchId={branchId} staffs={staffs} roles={roles} />
      </div>
    </div>
  )
}

