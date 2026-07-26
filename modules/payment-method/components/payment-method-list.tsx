"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PaymentMethodForm } from "./payment-method-form";
import { PageHeader } from "@/components/page-header";

export function PaymentMethodList({ data, accounts }: { data: any[], accounts: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "ledgerAccount",
      header: "Akun (COA)",
      cell: ({ row }) => {
        const acc = row.original.ledgerAccount;
        return acc ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{acc.code}</span>
            <span className="text-sm">{acc.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm italic">-</span>
        )
      }
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <span className={row.original.isActive ? "text-green-600" : "text-gray-400"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingItem(row.original);
            setIsOpen(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Metode Pembayaran"
          description="Kelola metode pembayaran dan akun yang terhubung."
        >
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingItem(null);
          }}>
            <DialogTrigger asChild>
              <Button>Add Payment Method</Button>
            </DialogTrigger>
          </Dialog>
        </PageHeader>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setEditingItem(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
            </DialogHeader>
            <PaymentMethodForm
              initialData={editingItem}
              accounts={accounts}
              onSuccess={() => {
                setIsOpen(false);
                setEditingItem(null);
              }}
              onCancel={() => {
                setIsOpen(false);
                setEditingItem(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  );
}
