"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import { AttendanceStatusDialog } from "./attendance-status-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useAttendanceStatusForm } from "../hooks/use-attendance-status"

interface AttendanceStatusTableProps {
  data: any[]
}

const ActionCell = ({ row, onDelete, isDeleting }: any) => {
  const [open, setOpen] = React.useState(false)
  const status = row.original

  return (
    <div className="flex items-center gap-2">
      <AttendanceStatusDialog initialData={status}>
        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-500">
          <Edit2 className="h-4 w-4" />
        </Button>
      </AttendanceStatusDialog>

      <Button variant="outline" size="icon" className="h-8 w-8 text-red-500" disabled={isDeleting} onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Hapus Status?"
        description={`Apakah Anda yakin ingin menghapus status ${status.name}?`}
        onConfirm={() => onDelete(status.id)}
      />
    </div>
  )
}

export function AttendanceStatusTable({ data }: AttendanceStatusTableProps) {
  const { onDelete, isDeleting } = useAttendanceStatusForm()

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: "Kode",
      cell: ({ row }) => <div className="font-bold text-primary">{row.getValue("code")}</div>,
    },
    {
      accessorKey: "name",
      header: "Nama Status",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("description") || "-"}</div>,
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => <ActionCell row={row} onDelete={onDelete} isDeleting={isDeleting} />
    },
  ]

  return (
    <DataTable columns={columns} data={data} emptyMessage="Belum ada data status absensi." />
  )
}
