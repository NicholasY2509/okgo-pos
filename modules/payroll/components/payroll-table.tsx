"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PayrollDetailsDialog } from "./payroll-details-dialog";

type PayrollListItem = {
  id: string;
  staff: { firstName: string; lastName: string };
  monthPeriod: string;
  baseSalary: any;
  netSalary: any;
  status: string;
};

export function PayrollTable({ data }: { data: PayrollListItem[] }) {
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsData, setDetailsData] = useState<any>(null);

  const fetchDetails = async (id: string) => {
    setLoadingDetails(true);
    setSelectedPayrollId(id);
    setDialogOpen(true);
    
    try {
      // In a real app, you might use React Query or pass a server action down as a prop
      // Since this is a client component, we should ideally fetch via server action or API route.
      // We will create a simple server action for getting details.
      const { getPayrollDetailsAction } = await import("../actions/payroll-action");
      const res = await getPayrollDetailsAction(id);
      if (res.data) {
        setDetailsData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const columns: ColumnDef<PayrollListItem>[] = [
    {
      accessorKey: "staffName",
      header: "Nama Staf",
      cell: ({ row }) => {
        const staff = row.original.staff;
        return `${staff.firstName} ${staff.lastName}`;
      },
    },
    {
      accessorKey: "monthPeriod",
      header: "Periode",
    },
    {
      accessorKey: "baseSalary",
      header: "Gaji Pokok",
      cell: ({ row }) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(row.getValue("baseSalary")));
      },
    },
    {
      accessorKey: "netSalary",
      header: "Gaji Bersih",
      cell: ({ row }) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(row.getValue("netSalary")));
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge variant={status === "DRAFT" ? "secondary" : "default"}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button variant="outline" size="sm" onClick={() => fetchDetails(row.original.id)}>
            Lihat Detail
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} />
      
      {dialogOpen && (
        <PayrollDetailsDialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setDetailsData(null);
              setSelectedPayrollId(null);
            }
          }} 
          payroll={detailsData} 
        />
      )}
    </>
  );
}
