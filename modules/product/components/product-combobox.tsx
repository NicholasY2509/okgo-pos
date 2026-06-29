"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProductCombobox } from "../hooks/use-product-combobox";

interface ProductComboboxProps {
  branchId: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function ProductCombobox({ branchId, value, onChange, error }: ProductComboboxProps) {
  const { open, setOpen, services, loading } = useProductCombobox(branchId);

  // Services is a flat array of products
  const selectedProduct = services.find((p: any) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memuat layanan...
            </span>
          ) : selectedProduct ? (
            <span className="truncate">
              {selectedProduct.name} ({selectedProduct.duration}m) - Rp {selectedProduct.price.toLocaleString('id-ID')}
            </span>
          ) : (
            "Pilih layanan..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder="Cari layanan..." />
          <CommandList>
            <CommandEmpty>Layanan tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {services.map((p: any) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.id}`}
                  onSelect={() => {
                    onChange(p.id === value ? "" : p.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === p.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {p.name} ({p.duration || 0}m) - Rp {p.price?.toLocaleString('id-ID') || 0}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
