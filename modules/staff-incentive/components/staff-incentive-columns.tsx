"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getStaffIncentiveColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "date",
    header: "Tanggal",
    cell: ({ row }) => {
      const date = new Date(row.original.date);
      return format(date, "dd MMM yyyy, HH:mm", { locale: id });
    },
  },
  {
    accessorKey: "staff.firstName",
    header: "Staf",
    cell: ({ row }) => {
      const staff = row.original.staff;
      if (!staff) return "-";
      return `${staff.firstName} ${staff.lastName || ""}`.trim();
    },
  },
  {
    accessorKey: "type",
    header: "Tipe",
    cell: ({ row }) => {
      const type = row.original.type;
      if (type === "SERVICE_COMMISSION") {
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Komisi Terapis</span>;
      }
      if (type === "CASHIER_COMMISSION") {
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Insentif Kasir</span>;
      }
      return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{type}</span>;
    },
  },
  {
    accessorKey: "amount",
    header: "Nominal",
    cell: ({ row }) => formatCurrency(Number(row.original.amount)),
  },
  {
    accessorKey: "description",
    header: "Deskripsi",
  },
];
