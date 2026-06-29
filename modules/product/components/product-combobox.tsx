"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";

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
    <Popover open={open} onOpenChange={setOpen} modal={true}>
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
              {selectedProduct.name}
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
              <CommandItem
                value=""
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-muted-foreground italic py-3"
              >
                Kosongkan pilihan
              </CommandItem>
              {services.map((p: any) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.id}`}
                  data-checked={value === p.id}
                  onSelect={() => {
                    onChange(p.id === value ? "" : p.id);
                    setOpen(false);
                  }}
                  className="py-3 flex items-center"
                >
                  <div className="flex flex-col">
                    <div className="font-medium">
                      {p.name}
                      {p.isVip && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-amber-500 text-amber-700 bg-amber-50 text-[9px] px-2 py-0"
                        >
                          VIP
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">{p.duration}m - {formatIDR(p.price)}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
