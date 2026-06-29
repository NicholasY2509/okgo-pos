"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Scissors, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { BookingActionCell } from "./booking-action-cell";

export const bookingColumns: ColumnDef<any>[] = [
  {
    accessorKey: "schedule",
    header: "Jadwal",
    cell: ({ row }) => {
      const booking = row.original;
      let earliestTime: Date | null = null;
      const sessions = booking.serviceSessions || [];

      sessions.forEach((s: any) => {
        if (s.startTime) {
          const d = new Date(s.startTime);
          if (!earliestTime || d < earliestTime) {
            earliestTime = d;
          }
        }
      });

      return (
        <div className="flex items-center gap-1.5 font-medium text-primary whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5" />
          {earliestTime ? format(earliestTime, "dd MMM yy HH:mm", { locale: id }) : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Pada",
    cell: ({ row }) => {
      return (
        <div className="text-muted-foreground text-xs whitespace-nowrap">
          {format(new Date(row.original.createdAt), "dd MMM yy HH:mm", { locale: id })}
        </div>
      );
    },
  },
  {
    accessorKey: "bookingNumber",
    header: "No. Booking",
    cell: ({ row }) => {
      return <div className="font-mono font-medium">{row.original.bookingNumber}</div>;
    },
  },
  {
    accessorKey: "customer",
    header: "Pelanggan",
    cell: ({ row }) => {
      const customer = row.original.customer;
      return (
        <div>
          <div className="font-medium">{customer?.name || "-"}</div>
          <div className="text-xs text-muted-foreground">{customer?.phone || "-"}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "items",
    header: "Layanan",
    cell: ({ row }) => {
      const items = row.original.items || [];
      return (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
            <Scissors className="w-3 h-3 text-muted-foreground" />
            <span>{items.length} Layanan</span>
          </div>
          <div className="text-xs text-muted-foreground max-w-[200px] truncate">
            {items.map((i: any) => i.itemNameSnapshot).join(", ")}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-semibold">
          {formatIDR(Number(row.original.totalAmount))}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="text-center">
          <Badge 
            variant="secondary" 
            className={`text-[10px] uppercase ${
              status === 'PENDING' ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' : 
              status === 'PROCESSED' ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' : 
              'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20'
            }`}
          >
            {status}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Aksi</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <BookingActionCell booking={row.original} />
        </div>
      );
    },
  },
];
