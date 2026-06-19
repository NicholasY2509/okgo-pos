"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export type StaffData = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  isActive: boolean
  createdAt: Date
  workPosition: {
    name: string
  }
  branch: {
    name: string
  } | null
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
    header: "Name",
    cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
  },
  {
    accessorKey: "workPosition.name",
    header: "Position",
  },
  {
    accessorKey: "branch.name",
    header: "Branch",
    cell: ({ row }) => row.original.branch?.name || "Global",
  },
  {
    id: "linkedUser",
    header: "Linked Account",
    cell: ({ row }) => {
      const users = row.original.staffUsers
      if (!users || users.length === 0) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex flex-col">
          {users.map(su => (
            <span key={su.user.email} className="text-sm">{su.user.name || su.user.email}</span>
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
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Link href={`/staff/${row.original.id}`}>
          <Button variant="ghost" size="sm">View Details</Button>
        </Link>
      )
    }
  }
]
