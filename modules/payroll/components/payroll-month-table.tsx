"use client";

import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type PayrollSummary = {
  monthPeriod: string;
  totalEmployees: number;
  totalBaseSalary: number;
  totalNetSalary: number;
  allPaid: boolean;
};

export function PayrollMonthTable({ data }: { data: PayrollSummary[] }) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  const columns: ColumnDef<PayrollSummary>[] = [
    {
      accessorKey: "monthPeriod",
      header: "Periode Bulan",
    },
    {
      accessorKey: "totalEmployees",
      header: "Total Karyawan",
    },
    {
      accessorKey: "totalBaseSalary",
      header: "Total Gaji Pokok",
      cell: ({ row }) => formatCurrency(row.original.totalBaseSalary),
    },
    {
      accessorKey: "totalNetSalary",
      header: "Total Gaji Bersih",
      cell: ({ row }) => formatCurrency(row.original.totalNetSalary),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const isPaid = row.original.allPaid;
        return <Badge variant={isPaid ? "default" : "secondary"}>{isPaid ? "LUNAS" : "DRAFT"}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Link href={`/admin/payroll/${row.original.monthPeriod}`}>
            <Button variant="outline" size="sm">
              Lihat Staf
            </Button>
          </Link>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
