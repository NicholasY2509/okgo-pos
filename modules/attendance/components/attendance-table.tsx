"use client"

import React, { useTransition } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { AttendanceStatusPicker } from "@/modules/attendance-status/components/attendance-status-picker"
import { updateAttendanceStatusAction } from "../actions/attendance-action"
import { toast } from "sonner"
import { Lock } from "lucide-react"

interface AttendanceTableProps {
  data: any[]
  statuses?: any[]
}

function StatusCell({ row, statuses }: { row: any, statuses?: any[] }) {
  const [isPending, startTransition] = useTransition()
  const status = row.original.status
  const isManualOverride = row.original.isManualOverride
  
  const handleStatusChange = (newStatusId: string) => {
    if (!newStatusId) return
    startTransition(async () => {
      const res = await updateAttendanceStatusAction(row.original.id, newStatusId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Status absensi berhasil diubah.")
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-32">
        <AttendanceStatusPicker 
          value={status?.id} 
          onChange={handleStatusChange} 
          statusList={statuses}
          className="h-8"
        />
      </div>
      {isManualOverride && (
        <div title="Diubah secara manual (tidak akan dioverride otomatis)">
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export function AttendanceTable({ data, statuses }: AttendanceTableProps) {
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "attendanceDate",
      header: "Tanggal",
      cell: ({ row }) => {
        const date = new Date(row.getValue("attendanceDate"))
        return <div className="font-medium">{date.toLocaleDateString("id-ID")}</div>
      },
    },
    {
      accessorKey: "staff.firstName",
      header: "Nama Staf",
      cell: ({ row }) => {
        const staff = row.original.staff
        return <div className="font-bold text-primary">{staff?.firstName} {staff?.lastName}</div>
      },
    },
    {
      accessorKey: "clockIn",
      header: "Jam Masuk",
      cell: ({ row }) => {
        const clockIn = row.getValue("clockIn") as Date | null
        const machine = row.original.clockInMachine
        return (
          <div>
            <div className="font-medium">{clockIn ? new Date(clockIn).toLocaleTimeString("id-ID") : "-"}</div>
            {machine && <div className="text-xs text-muted-foreground">{machine.name}</div>}
          </div>
        )
      },
    },
    {
      accessorKey: "clockOut",
      header: "Jam Pulang",
      cell: ({ row }) => {
        const clockOut = row.getValue("clockOut") as Date | null
        const machine = row.original.clockOutMachine
        return (
          <div>
            <div className="font-medium">{clockOut ? new Date(clockOut).toLocaleTimeString("id-ID") : "-"}</div>
            {machine && <div className="text-xs text-muted-foreground">{machine.name}</div>}
          </div>
        )
      },
    },
    {
      accessorKey: "status.name",
      header: "Status",
      cell: ({ row }) => {
        return <StatusCell row={row} statuses={statuses} />
      },
    },
  ]

  return (
    <DataTable columns={columns} data={data} emptyMessage="Belum ada data absensi utama." />
  )
}
