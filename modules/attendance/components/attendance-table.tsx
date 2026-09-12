"use client"

import React, { useTransition } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Lock, Logs, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"

interface AttendanceTableProps {
  data: any[]
  statuses?: any[]
  onRowClick?: (row: any) => void
}

function StatusCell({ row, onRowClick }: { row: any, onRowClick?: (row: any) => void }) {
  const status = row.original.status
  const isManualOverride = row.original.isManualOverride

  return (
    <Button
      variant="outline"
      size={'icon'}
      onClick={() => onRowClick?.(row.original)}
    >
      <Logs />
    </Button>
  )
}

function AttachmentCell({ url }: { url: string | null }) {
  if (!url) return <div className="text-muted-foreground">-</div>

  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null || url.includes("image")

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Paperclip className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Lampiran</DialogTitle>
        </DialogHeader>
        <div className="relative w-full aspect-video bg-muted/20 rounded-md overflow-hidden flex items-center justify-center">
          {isImage ? (
            <Image src={url} alt="Lampiran" fill className="object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Paperclip className="h-8 w-8" />
              <span>{url.split('/').pop()}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AttendanceTable({ data, statuses, onRowClick }: AttendanceTableProps) {
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
        return row.original.status.name
      },
    },
    {
      accessorKey: "attachmentUrl",
      header: "Lampiran",
      cell: ({ row }) => {
        return <AttachmentCell url={row.original.attachmentUrl} />
      },
    },
    {
      header: "Action",
      cell: ({ row }) => {
        return <StatusCell row={row} onRowClick={onRowClick} />
      },
    },
  ]

  return (
    <DataTable columns={columns} data={data} emptyMessage="Belum ada data absensi utama." />
  )
}
