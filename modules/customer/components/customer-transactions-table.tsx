"use client";

import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export function CustomerTransactionsTable({ data }: { data: any[] }) {
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "transactionNumber",
      header: "Nomor Transaksi",
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => `Rp ${Number(row.original.totalAmount).toLocaleString("id-ID")}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "COMPLETED" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
