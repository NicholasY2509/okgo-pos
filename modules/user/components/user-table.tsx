"use client"

import { DataTable } from "@/components/ui/data-table"
import { userColumns } from "./user-columns"
import { User } from "@/lib/generated/prisma"

// We define a type that includes the related branchUsers 
type UserWithRelations = User & {
  branchUsers?: {
    id: string
    branch: { name: string }
    role: { name: string }
  }[]
}

interface UserTableProps {
  data: UserWithRelations[]
}

export function UserTable({ data }: UserTableProps) {
  return <DataTable columns={userColumns} data={data} emptyMessage="No users found." />
}
