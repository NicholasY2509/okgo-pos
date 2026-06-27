"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface GetColumnsProps {
  onView: (transaction: any) => void;
}

export const getTransactionHistoryColumns = ({ onView }: GetColumnsProps): ColumnDef<any>[] => [
  {
    accessorKey: "createdAt",
    header: "Waktu",
    cell: ({ row }) => {
      return (
        <div className="whitespace-nowrap">
          {format(new Date(row.original.createdAt), "dd MMM yy HH:mm", { locale: id })}
        </div>
      );
    },
  },
  {
    accessorKey: "transactionNumber",
    header: "No. Transaksi",
    cell: ({ row }) => {
      return <div className="font-mono font-medium">{row.original.transactionNumber}</div>;
    },
  },
  {
    accessorKey: "customer",
    header: "Pelanggan",
    cell: ({ row }) => {
      return (
        <div>
          {row.original.customer?.name || (
            <span className="text-muted-foreground italic">Umum</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: () => <div className="text-right">Total Akhir</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-semibold">
          {formatCurrency(Number(row.original.totalAmount))}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return (
        <Badge
          variant={row.original.status === "COMPLETED" ? "default" : "secondary"}
          className="text-[10px]"
        >
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Aksi</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-primary"
            onClick={() => onView(row.original)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      );
    },
  },
];
