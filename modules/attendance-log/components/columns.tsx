"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type AttendanceLog = {
  id: string
  machineUserId: string | null
  cardName: string | null
  attendanceState: number
  punchType: string | null
  deviceSn: string | null
  similarity: number | null
  utcTime: Date | null
  createdAt: Date
}

function getPunchTypeBadge(state: number) {
  switch (state) {
    case 0:
      return <Badge variant="outline" className="bg-gray-500 text-white">Tidak Dikenal ({state})</Badge>
    case 1:
      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Masuk ({state})</Badge>
    case 2:
      return <Badge variant="secondary">Mulai Istirahat ({state})</Badge>
    case 3:
      return <Badge variant="secondary">Selesai Istirahat ({state})</Badge>
    case 4:
      return <Badge variant="destructive">Pulang ({state})</Badge>
    case 5:
      return <Badge variant="outline" className="text-orange-500 border-orange-500">Mulai Lembur ({state})</Badge>
    case 6:
      return <Badge variant="outline" className="text-purple-500 border-purple-500">Selesai Lembur ({state})</Badge>
    default:
      return <Badge variant="outline">Unknown ({state})</Badge>
  }
}

export const columns: ColumnDef<AttendanceLog>[] = [
  {
    accessorKey: "createdAt",
    header: "Waktu di Server",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date
      return <div>{new Date(date).toLocaleString("id-ID")}</div>
    },
  },
  {
    accessorKey: "utcTime",
    header: "Waktu di Mesin",
    cell: ({ row }) => {
      const date = row.getValue("utcTime") as Date | null
      return <div>{date ? new Date(date).toLocaleString("id-ID") : "-"}</div>
    },
  },
  {
    accessorKey: "cardName",
    header: "Nama Karyawan",
    cell: ({ row }) => {
      const staff = (row.original as any).staff
      const cardName = row.getValue("cardName") as string
      const id = row.original.machineUserId
      return (
        <div>
          <div className="font-medium text-primary">
            {staff ? `${staff.firstName} ${staff.lastName}` : (cardName || "Tidak Dikenal")}
          </div>
          <div className="text-xs text-muted-foreground">ID Mesin: {id}</div>
          {staff && cardName && cardName !== "Unknown" && (
            <div className="text-xs text-muted-foreground">Nama di Mesin: {cardName}</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "attendanceState",
    header: "Status",
    cell: ({ row }) => {
      const state = row.getValue("attendanceState") as number
      return getPunchTypeBadge(state)
    },
  },
  {
    accessorKey: "similarity",
    header: "Kecocokan",
    cell: ({ row }) => {
      const sim = row.getValue("similarity") as number | null
      return <div>{sim ? `${sim}%` : "-"}</div>
    },
  },
  {
    accessorKey: "deviceSn",
    header: "Mesin / Cabang",
    cell: ({ row }) => {
      const sn = row.getValue("deviceSn") as string
      const branch = (row.original as any).branch
      return (
        <div>
          <div className="text-sm">{sn}</div>
          <div className="text-xs font-medium text-primary">
            {branch ? branch.name : "Tidak terhubung"}
          </div>
        </div>
      )
    },
  },
]
