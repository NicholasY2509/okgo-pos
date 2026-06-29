"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Search, UserPlus, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { searchCustomersAction } from "../../customer/actions/customer-action";
import { cn } from "@/lib/utils";

import { useCustomerSelection } from "../hooks/use-customer-selection";

interface CustomerSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomerId?: string;
  onSelectCustomer: (id: string | undefined) => void;
  onNewCustomer: () => void;
  initialCustomers?: any[];
}

export function CustomerSelectionDialog({
  open,
  onOpenChange,
  selectedCustomerId,
  onSelectCustomer,
  onNewCustomer,
  initialCustomers = []
}: CustomerSelectionDialogProps) {
  const {
    customers,
    searchQuery,
    setSearchQuery,
    loading,
    page,
    handleScroll
  } = useCustomerSelection(open, initialCustomers);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle>Pilih Pelanggan</DialogTitle>
            <DialogDescription>
              Cari pelanggan yang sudah ada atau daftarkan pelanggan baru.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau telepon..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={() => {
              onOpenChange(false);
              onNewCustomer();
            }}>
              <UserPlus className="w-4 h-4 mr-2" />
              Baru
            </Button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-2 min-h-[300px]"
          onScroll={handleScroll}
        >
          {selectedCustomerId && (
            <div className="px-2 pb-2 mb-2 border-b">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onSelectCustomer(undefined);
                  onOpenChange(false);
                }}
              >
                Kosongkan Pilihan (Tanpa Pelanggan)
              </Button>
            </div>
          )}

          {loading && page === 1 ? (
            <div className="space-y-2 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-transparent">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <User className="w-12 h-12 mb-2 opacity-20" />
              <p>Tidak ada pelanggan ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectCustomer(c.id);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors border",
                    selectedCustomerId === c.id
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "border-transparent hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                    selectedCustomerId === c.id ? "bg-primary text-primary-foreground" : "bg-muted-foreground/10 text-muted-foreground"
                  )}>
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate">{c.name}</p>
                    {c.phone && <p className="text-xs opacity-70 truncate">{c.phone}</p>}
                  </div>
                  {selectedCustomerId === c.id && (
                    <Check className="w-5 h-5 shrink-0" />
                  )}
                </button>
              ))}

              {loading && page > 1 && (
                <div className="py-4 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
