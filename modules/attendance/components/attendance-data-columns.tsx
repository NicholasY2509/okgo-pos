"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export type DummyAttendanceData = {
  id: string
  staffName: string
  date: Date
  status: "Present" | "Late" | "Absent"
  clockInTime: string | null
  clockOutTime: string | null
}

export const attendanceDataColumns: ColumnDef<DummyAttendanceData>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => format(row.original.date, "dd MMM yyyy")
  },
  {
    accessorKey: "staffName",
    header: "Staff Name",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={status === "Present" ? "default" : status === "Late" ? "secondary" : "destructive"}>
          {status}
        </Badge>
      )
    }
  },
  {
    accessorKey: "clockInTime",
    header: "Clock In",
    cell: ({ row }) => row.original.clockInTime || "-"
  },
  {
    accessorKey: "clockOutTime",
    header: "Clock Out",
    cell: ({ row }) => row.original.clockOutTime || "-"
  },
]
