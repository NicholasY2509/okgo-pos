"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import { MachineDialog } from "./machine-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useAttendanceMachineForm } from "../hooks/use-attendance-machine"

interface MachineTableProps {
  data: any[]
  branches: { id: string; name: string }[]
}

const ActionCell = ({ row, branches, onDelete, isDeleting }: any) => {
  const [open, setOpen] = React.useState(false)
  const machine = row.original

  return (
    <div className="flex items-center gap-2">
      <MachineDialog initialData={machine} branches={branches}>
        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-500">
          <Edit2 className="h-4 w-4" />
        </Button>
      </MachineDialog>

      <Button variant="outline" size="icon" className="h-8 w-8 text-red-500" disabled={isDeleting} onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Hapus Mesin?"
        description={`Apakah Anda yakin ingin menghapus mesin ${machine.name} (${machine.sn})?`}
        onConfirm={() => onDelete(machine.id)}
      />
    </div>
  )
}

export function MachineTable({ data, branches }: MachineTableProps) {
  const { onDelete, isDeleting } = useAttendanceMachineForm()

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "sn",
      header: "Serial Number",
      cell: ({ row }) => <div className="font-medium">{row.getValue("sn")}</div>,
    },
    {
      accessorKey: "name",
      header: "Nama Mesin",
    },
    {
      accessorKey: "branch.name",
      header: "Cabang Penempatan",
      cell: ({ row }) => <div>{row.original.branch?.name || "-"}</div>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive")
        return isActive
          ? <Badge className="bg-green-500 hover:bg-green-600">Aktif</Badge>
          : <Badge variant="secondary">Nonaktif</Badge>
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => <ActionCell row={row} branches={branches} onDelete={onDelete} isDeleting={isDeleting} />
    },
  ]

  return (
    <DataTable columns={columns} data={data} emptyMessage="Belum ada mesin absensi yang ditambahkan." />
  )
}
