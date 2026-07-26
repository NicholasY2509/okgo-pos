"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"

interface AttendanceTableProps {
  data: any[]
}

export function AttendanceTable({ data }: AttendanceTableProps) {
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
        const status = row.original.status
        return status ? <Badge>{status.name}</Badge> : <span className="text-muted-foreground">-</span>
      },
    },
  ]

  return (
    <DataTable columns={columns} data={data} emptyMessage="Belum ada data absensi utama." />
  )
}
