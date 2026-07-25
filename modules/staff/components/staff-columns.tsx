"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logs } from "lucide-react"

export type StaffData = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  staffIdNumber: string | null
  isActive: boolean
  createdAt: Date
  workPosition: {
    name: string
  }
  branchStaffs?: {
    branch: {
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

export const staffColumns: ColumnDef<StaffData>[] = [
  {
    accessorKey: "name",
    header: "Nama",
    cell: ({ row }) => (
      <div className="flex flex-col ">
        <span>{row.original.firstName} {row.original.lastName}</span>
        <span className="text-xs text-muted-foreground">{row.original.staffIdNumber}</span>
      </div>
    ),
  },
  {
    accessorKey: "workPosition.name",
    header: "Posisi",
  },
  {
    id: "branches",
    header: "Cabang",
    cell: ({ row }) => {
      const branches = row.original.branchStaffs
      if (!branches || branches.length === 0) return "Global"
      return branches.map(bs => bs.branch.name).join(", ")
    },
  },
  {
    id: "linkedUser",
    header: "Akun Tertaut",
    cell: ({ row }) => {
      const users = row.original.staffUsers
      if (!users || users.length === 0) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex flex-col gap-2">
          {users.map(su => (
            <div key={su.user.email} className="flex flex-col">
              {su.user.name && <span className="text-sm font-medium">{su.user.name}</span>}
              {su.user.email && <span className="text-xs text-muted-foreground">{su.user.email}</span>}
            </div>
          ))}
        </div>
      )
    }
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
      return (
        <Link href={`/staff/${row.original.id}`}>
          <Button variant="outline" size="icon"><Logs /></Button>
        </Link>
      )
    }
  }
]
