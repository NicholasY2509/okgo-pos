"use client"

import { DataTable } from "@/components/ui/data-table"
import { getColumns } from "./room-columns"
import { RoomWithBranch } from "../types/room-types"
import { Branch } from "@/modules/branch/types/branch-types"

interface RoomTableProps {
  data: RoomWithBranch[]
  branches: Pick<Branch, "id" | "name">[]
}

export function RoomTable({ data, branches }: RoomTableProps) {
  const columns = getColumns({ branches })
  
  return <DataTable columns={columns} data={data} emptyMessage="Tidak ada ruangan yang ditemukan." />
}
