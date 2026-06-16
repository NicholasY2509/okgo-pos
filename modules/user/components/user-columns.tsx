"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/lib/generated/prisma"
import { Building, Shield } from "lucide-react"
import { UserDialog } from "./user-dialog"

// We define a type that includes the related branchUsers 
type UserWithRelations = User & {
  branchUsers?: {
    id: string
    branch: { name: string }
    role: { name: string }
  }[]
}

export const userColumns: ColumnDef<UserWithRelations>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <div className="font-medium">{row.getValue("name")}</div>
      )
    }
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "assignments",
    header: "Assigned Branches",
    cell: ({ row }) => {
      const branchUsers = row.original.branchUsers

      if (!branchUsers || branchUsers.length === 0) {
        return <span className="text-muted-foreground italic text-xs">No branches</span>
      }

      return (
        <div className="flex flex-col gap-1">
          {branchUsers.map((bu) => (
            <div key={bu.id} className="flex items-center gap-1.5 text-xs bg-secondary/50 p-1 px-2 rounded-md w-fit">
              <Building className="h-3 w-3 text-muted-foreground" />
              <span>{bu.branch.name}</span>
              <span className="text-muted-foreground mx-0.5">•</span>
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium text-primary">{bu.role.name}</span>
            </div>
          ))}
        </div>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original

      return (
        <div className="flex justify-end">
          <UserDialog initialData={user} />
        </div>
      )
    },
  },
]
