"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logs, ArrowRightLeft } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { TransferStaffDialog } from "@/modules/branch/components/transfer-staff-dialog"

export type StaffData = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  staffIdNumber: string | null
  isActive: boolean
  level?: string | null
  createdAt: Date
  workPosition?: {
    name: string
  } | null
  branchStaffs?: {
    id?: string
    branchId?: string
    branch: {
      id?: string
      name: string
    }
    role?: {
      id?: string
      name: string
    }
  }[]
  staffUsers?: {
    user: {
      name: string | null
      email: string | null
    }
  }[]
}

interface GetStaffColumnsProps {
  branches?: { id: string; name: string }[]
  roles?: { id: string; name: string }[]
}

export function getStaffColumns({
  branches = [],
  roles = [],
}: GetStaffColumnsProps = {}): ColumnDef<StaffData>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Pilih semua baris"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Pilih baris"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Nama",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {row.original.firstName} {row.original.lastName}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.staffIdNumber || "-"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "workPosition.name",
      header: "Posisi",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.workPosition?.name || "-"}</span>
          {row.original.level && (
            <span className="text-xs text-muted-foreground">
              {row.original.level === "JUNIOR" ? "Junior" : row.original.level === "SENIOR" ? "Senior" : row.original.level}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "branches",
      header: "Cabang",
      cell: ({ row }) => {
        const branchList = row.original.branchStaffs
        if (!branchList || branchList.length === 0) {
          return (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              Global
            </Badge>
          )
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {branchList.map((bs, index) => (
              <Badge key={`${bs.branch.name}-${index}`} variant="secondary" className="font-normal text-xs">
                {bs.branch.name}
                {bs.role?.name && <span className="opacity-70 ml-1">({bs.role.name})</span>}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      id: "linkedUser",
      header: "Akun Tertaut",
      cell: ({ row }) => {
        const users = row.original.staffUsers
        if (!users || users.length === 0) return <span className="text-muted-foreground">-</span>
        return (
          <div className="flex flex-col gap-1">
            {users.map((su, idx) => (
              <div key={su.user.email || idx} className="flex flex-col">
                {su.user.name && <span className="text-sm font-medium">{su.user.name}</span>}
                {su.user.email && <span className="text-xs text-muted-foreground">{su.user.email}</span>}
              </div>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Aktif" : "Tidak Aktif"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const staff = row.original
        const primaryBranch = staff.branchStaffs?.[0]

        return (
          <div className="flex items-center gap-1">
            {branches.length > 0 && roles.length > 0 && (
              <TransferStaffDialog
                staffId={staff.id}
                staffName={`${staff.firstName} ${staff.lastName}`}
                currentBranchId={primaryBranch?.branch?.id || primaryBranch?.branchId}
                currentBranchName={primaryBranch?.branch?.name}
                currentRoleId={primaryBranch?.role?.id}
                branches={branches}
                roles={roles}
                trigger={
                  <Button variant="ghost" size="icon" title="Pindah Cabang">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                }
              />
            )}
            <Link href={`/admin/staff/${staff.id}`}>
              <Button variant="ghost" size="icon" title="Lihat Detail Staf">
                <Logs className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]
}

export const staffColumns: ColumnDef<StaffData>[] = getStaffColumns()
