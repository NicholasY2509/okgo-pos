"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm } from "../../../customer/components/customer-form";
import { CustomerSelectionDialog } from "../customer-selection-dialog";
import { usePosStoreSelector, usePosStoreActions } from "../../stores/pos-store";

interface CartCustomerProps {
  customers: any[];
}

export function CartCustomer({ customers }: CartCustomerProps) {
  const router = useRouter();
  const customerId = usePosStoreSelector((state) => state.customerId);
  const { setCustomerId } = usePosStoreActions();

  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);

  return (
    <>
      <div className="mb-3 bg-muted/50 p-2.5 rounded-lg border border-border shrink-0">
        <button
          className="w-full flex items-center justify-between bg-background border border-input rounded-md px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors"
          onClick={() => setIsCustomerSelectionOpen(true)}
        >
          {customerId ? (
            <span className="font-medium text-primary">
              {customers.find(c => c.id === customerId)?.name || "Pelanggan Terpilih"}
            </span>
          ) : (
            <span className="text-muted-foreground">-- Pilih Pelanggan --</span>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground opacity-50" />
        </button>
      </div>

      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
          </DialogHeader>
          <div className="">
            <CustomerForm
              onSuccess={(customer) => {
                setIsNewCustomerOpen(false);
                router.refresh();
                setCustomerId(customer.id);
              }}
              onCancel={() => setIsNewCustomerOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <CustomerSelectionDialog
        open={isCustomerSelectionOpen}
        onOpenChange={setIsCustomerSelectionOpen}
        selectedCustomerId={customerId}
        onSelectCustomer={setCustomerId}
        onNewCustomer={() => setIsNewCustomerOpen(true)}
        initialCustomers={customers}
      />
    </>
  );
}
