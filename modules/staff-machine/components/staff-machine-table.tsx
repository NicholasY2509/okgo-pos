"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import { StaffMachineDialog } from "./staff-machine-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useStaffMachineForm } from "../hooks/use-staff-machine"

interface StaffMachineTableProps {
  staffId: string
  data: any[]
  machines: any[]
}

const ActionCell = ({ row, staffId, machines, onDelete, isDeleting }: any) => {
  const [open, setOpen] = React.useState(false)
  const staffMachine = row.original

  return (
    <div className="flex items-center gap-2">
      <StaffMachineDialog staffId={staffId} initialData={staffMachine} machines={machines}>
        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-500">
          <Edit2 className="h-4 w-4" />
        </Button>
      </StaffMachineDialog>

      <Button variant="outline" size="icon" className="h-8 w-8 text-red-500" disabled={isDeleting} onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Hapus Tautan?"
        description={`Apakah Anda yakin ingin menghapus tautan ID ${staffMachine.machineUserId} di mesin ${staffMachine.machine.name}?`}
        onConfirm={() => onDelete(staffMachine.id)}
      />
    </div>
  )
}

export function StaffMachineTable({ staffId, data, machines }: StaffMachineTableProps) {
  const { onDelete, isDeleting } = useStaffMachineForm(staffId)

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "machine.name",
      header: "Mesin Absensi",
      cell: ({ row }) => <div className="font-medium">{row.original.machine?.name}</div>,
    },
    {
      accessorKey: "machine.branch.name",
      header: "Cabang",
      cell: ({ row }) => <div>{row.original.machine?.branch?.name || "-"}</div>,
    },
    {
      accessorKey: "machineUserId",
      header: "ID di Mesin",
      cell: ({ row }) => <div className="font-bold text-primary">{row.getValue("machineUserId")}</div>,
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => <ActionCell row={row} staffId={staffId} machines={machines} onDelete={onDelete} isDeleting={isDeleting} />
    },
  ]

  return (
    <DataTable columns={columns} data={data} emptyMessage="Belum ada mesin absensi yang ditautkan ke staff ini." />

  )
}
