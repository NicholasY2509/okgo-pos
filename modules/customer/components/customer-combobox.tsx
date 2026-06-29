"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCustomerCombobox } from "../hooks/use-customer-combobox";

interface CustomerComboboxProps {
  selectedCustomerId?: string;
  onSelectCustomer: (customerId: string | undefined) => void;
  // Passing initial customers in case we have pre-fetched data (optional)
  initialCustomers?: any[];
}

export function CustomerCombobox({ selectedCustomerId, onSelectCustomer, initialCustomers = [] }: CustomerComboboxProps) {
  const {
    open,
    setOpen,
    customers,
    searchQuery,
    setSearchQuery,
    loading,
    page,
    hasMore,
    handleScroll
  } = useCustomerCombobox(initialCustomers);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  
  // If we have a selected ID but the customer is not in the list (e.g. from initial load without full list), 
  // we might want to display a fallback or fetch it, but usually the parent passes it or it's just 'Selected'
  const displayValue = selectedCustomer 
    ? `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ""}`
    : "Cari pelanggan...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Ketik nama atau nomor telepon..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList onScroll={handleScroll} className="max-h-[300px] overflow-y-auto">
            {loading && page === 1 && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Mencari...
              </div>
            )}
            
            {!loading && customers.length === 0 && (
              <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
            )}

            <CommandGroup>
              {customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onSelectCustomer(c.id === selectedCustomerId ? undefined : c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCustomerId === c.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
            
            {loading && page > 1 && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Memuat lebih...
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
