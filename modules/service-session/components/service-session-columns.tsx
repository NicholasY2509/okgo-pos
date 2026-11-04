"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Calendar, Eye, Star, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ServiceSessionItem } from "../hooks/use-service-sessions"

interface GetColumnsProps {
  onView: (session: ServiceSessionItem) => void
}

export function getServiceSessionColumns({
  onView,
}: GetColumnsProps): ColumnDef<ServiceSessionItem>[] {
  return [
    {
      accessorKey: "schedule",
      header: "Waktu / Jadwal",
      cell: ({ row }) => {
        const item = row.original
        const scheduleTime = item.startTime
          ? new Date(item.startTime)
          : item.actualStartTime
          ? new Date(item.actualStartTime)
          : item.createdAt
          ? new Date(item.createdAt)
          : null

        return (
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-1.5 font-medium text-foreground whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {scheduleTime
                ? format(scheduleTime, "dd MMM yyyy HH:mm", { locale: id })
                : "-"}
            </div>
            {item.actualStartTime && item.status === "IN_PROGRESS" && (
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <Clock className="w-3 h-3" />
                Mulai:{" "}
                {format(new Date(item.actualStartTime), "HH:mm", { locale: id })}
              </div>
            )}
            {item.actualEndTime && item.status === "COMPLETED" && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                Selesai:{" "}
                {format(new Date(item.actualEndTime), "HH:mm", { locale: id })}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        switch (status) {
          case "IN_PROGRESS":
            return (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Berlangsung
              </Badge>
            )
          case "SCHEDULED":
            return (
              <Badge variant="secondary" className="font-medium">
                Terjadwal
              </Badge>
            )
          case "COMPLETED":
            return (
              <Badge
                variant="outline"
                className="border-emerald-600/30 text-emerald-600 dark:text-emerald-400 font-medium"
              >
                Selesai
              </Badge>
            )
          case "CANCELLED":
            return (
              <Badge variant="destructive" className="font-medium">
                Dibatalkan
              </Badge>
            )
          default:
            return <Badge variant="outline">{status}</Badge>
        }
      },
    },
    {
      accessorKey: "serviceName",
      header: "Layanan",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="max-w-[220px]">
            <div className="font-medium truncate">{item.serviceName}</div>
            {item.serviceDuration && (
              <div className="text-xs text-muted-foreground">
                Durasi: {item.serviceDuration} menit
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "roomName",
      header: "Ruangan",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={
                item.roomIsVip
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-muted/50"
              }
            >
              {item.roomName}
              {item.roomIsVip && " (VIP)"}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "staffName",
      header: "Terapis / Staf",
      cell: ({ row }) => {
        const staff = row.original.staffName
        if (!staff) {
          return <span className="text-muted-foreground italic text-xs">Belum ditentukan</span>
        }
        return <div className="font-medium text-sm">{staff}</div>
      },
    },
    {
      accessorKey: "customer",
      header: "Pelanggan",
      cell: ({ row }) => {
        const customer = row.original.customer
        if (!customer || (!customer.name && !customer.phone)) {
          return <span className="text-muted-foreground italic text-xs">Umum</span>
        }
        return (
          <div>
            <div className="font-medium text-sm">{customer.name || "Umum"}</div>
            {customer.phone && (
              <div className="text-xs text-muted-foreground">{customer.phone}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "reference",
      header: "Referensi",
      cell: ({ row }) => {
        const item = row.original
        if (item.bookingNumber) {
          return (
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Booking
              </span>
              <span className="font-mono text-xs font-medium">
                {item.bookingNumber}
              </span>
            </div>
          )
        }
        if (item.transactionNumber) {
          return (
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                POS
              </span>
              <span className="font-mono text-xs font-medium">
                {item.transactionNumber}
              </span>
            </div>
          )
        }
        return <span className="text-muted-foreground text-xs">-</span>
      },
    },
    {
      accessorKey: "rating",
      header: "Ulasan",
      cell: ({ row }) => {
        const item = row.original
        if (!item.rating) {
          return <span className="text-muted-foreground text-xs">-</span>
        }
        return (
          <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{item.rating}.0</span>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(row.original)}
              className="h-8 px-2 hover:bg-primary/10 hover:text-primary"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
              <span className="sr-only">Detail</span>
            </Button>
          </div>
        )
      },
    },
  ]
}

