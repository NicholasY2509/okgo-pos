"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin } from "lucide-react"
import { AssignStaffToBranchDialog } from "./assign-staff-to-branch-dialog"
import { TransferStaffDialog } from "@/modules/branch/components/transfer-staff-dialog"
import { RemoveStaffButton } from "@/modules/branch/components/remove-staff-button"

interface BranchStaffItem {
  id: string
  branchId: string
  branch: {
    id: string
    name: string
    subdomain: string
    address?: string | null
  }
  role: {
    id: string
    name: string
  }
}

interface StaffBranchCardProps {
  staffId: string
  staffName: string
  branchStaffs: BranchStaffItem[]
  branches: { id: string; name: string }[]
  roles: { id: string; name: string }[]
}

export function StaffBranchCard({
  staffId,
  staffName,
  branchStaffs,
  branches,
  roles,
}: StaffBranchCardProps) {
  const existingBranchIds = branchStaffs.map((bs) => bs.branchId)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Penugasan Cabang ({branchStaffs.length})
          </CardTitle>
          <CardDescription>
            Kelola cabang operasional dan peran akses staf ini.
          </CardDescription>
        </div>
        <AssignStaffToBranchDialog
          staffId={staffId}
          staffName={staffName}
          branches={branches}
          roles={roles}
          existingBranchIds={existingBranchIds}
        />
      </CardHeader>

      <CardContent>
        {branchStaffs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg bg-muted/20">
            <Building2 className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium">Belum Ditugaskan ke Cabang Tertentu</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Staf ini berstatus Global (belum terikat dengan cabang spesifik). Klik tombol di atas untuk menugaskan ke cabang.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {branchStaffs.map((bs) => (
              <div
                key={bs.id}
                className="flex items-center justify-between p-3.5 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{bs.branch.name}</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {bs.branch.subdomain}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TransferStaffDialog
                      staffId={staffId}
                      staffName={staffName}
                      currentBranchId={bs.branch.id}
                      currentBranchName={bs.branch.name}
                      currentRoleId={bs.role.id}
                      branches={branches}
                      roles={roles}
                      defaultMode="role"
                      trigger={
                        <button
                          type="button"
                          className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-2 py-0.5 rounded text-xs font-medium cursor-pointer"
                          title="Klik untuk ubah peran"
                        >
                          {bs.role.name}
                        </button>
                      }
                    />
                    {bs.branch.address && (
                      <span className="flex items-center gap-1 truncate max-w-[180px]">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {bs.branch.address}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <TransferStaffDialog
                    staffId={staffId}
                    staffName={staffName}
                    currentBranchId={bs.branch.id}
                    currentBranchName={bs.branch.name}
                    currentRoleId={bs.role.id}
                    branches={branches}
                    roles={roles}
                    defaultMode="transfer"
                  />
                  <RemoveStaffButton
                    branchStaffId={bs.id}
                    branchId={bs.branch.id}
                    staffId={staffId}
                    staffName={staffName}
                    branchName={bs.branch.name}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
