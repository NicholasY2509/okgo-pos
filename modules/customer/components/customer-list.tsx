"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CustomerForm } from "./customer-form";
import Link from "next/link";
import { Eye } from "lucide-react";

export function CustomerList({ data }: { data: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Link href={`/admin/customers/${row.original.id}`}>
            <Button variant="ghost" size="icon">
              <Eye />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
