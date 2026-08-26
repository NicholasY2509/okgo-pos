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
import { useGlobalProductCombobox } from "../hooks/use-global-product-combobox";
import { Badge } from "@/components/ui/badge";

interface GlobalProductComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  error?: boolean;
}

export function GlobalProductCombobox({ value, onChange, error }: GlobalProductComboboxProps) {
  const { open, setOpen, products, loading } = useGlobalProductCombobox();

  const selectedProduct = products.find((p: any) => p.id === value);

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
              Memuat produk...
            </span>
          ) : selectedProduct ? (
            <span className="truncate">
              {selectedProduct.name}
            </span>
          ) : (
            "Pilih produk..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder="Cari produk..." />
          <CommandList>
            <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {products.map((p: any) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.id}`}
                  data-checked={value === p.id}
                  onSelect={() => {
                    onChange(p.id === value ? null : p.id);
                    setOpen(false);
                  }}
                  className="py-3 flex items-center"
                >
                  <div className="flex flex-col">
                    <div className="font-medium flex items-center">
                      {p.name}
                      {p.isVip && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-amber-500 text-amber-700 bg-amber-50 text-[9px] px-2 py-0"
                        >
                          VIP
                        </Badge>
                      )}
                      {!p.isActive && (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-[9px] px-2 py-0"
                        >
                          Tidak Aktif
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">{p.duration ? `${p.duration}m - ` : ''}{formatIDR(p.price)}</div>
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
