"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm } from "../../customer/components/customer-form";
import { CustomerSelectionDialog } from "./customer-selection-dialog";
import { getCustomerByIdAction } from "../../customer/actions/customer-action";
import { Button } from "@/components/ui/button";

interface CustomerSelectorProps {
  value: string | undefined;
  onChange: (customerId: string | undefined) => void;
  error?: boolean;
}

export function CustomerSelector({ value, onChange, error }: CustomerSelectorProps) {
  const router = useRouter();
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value) {
      setLoading(true);
      getCustomerByIdAction(value).then(res => {
        if (res.success && res.data) {
          setCustomerName(res.data.name);
          setCustomerPhoneNumber(res.data.phone);
        }
        setLoading(false);
      });
    } else {
      setCustomerName(null);
      setCustomerPhoneNumber(null);
    }
  }, [value]);

  return (
    <>
      <Button
        variant={'outline'}
        type="button"
        className="w-full flex justify-between items-center"
        onClick={() => setIsCustomerSelectionOpen(true)}
      >
        {value ? (
          <span className="font-medium text-primary flex items-center">
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
            {customerName || "Pelanggan Terpilih"} ({customerPhoneNumber})
          </span>
        ) : (
          <span className="">-- Pilih Pelanggan --</span>
        )}
        <ChevronDown className="w-4 h-4" />
      </Button>

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
                onChange(customer.id);
              }}
              onCancel={() => setIsNewCustomerOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <CustomerSelectionDialog
        open={isCustomerSelectionOpen}
        onOpenChange={setIsCustomerSelectionOpen}
        selectedCustomerId={value}
        onSelectCustomer={(id) => {
          onChange(id);
          // Pre-emptively set name if we can, but it will fetch anyway
        }}
        onNewCustomer={() => setIsNewCustomerOpen(true)}
        initialCustomers={[]}
      />
    </>
  );
}
