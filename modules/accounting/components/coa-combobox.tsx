"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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

interface CoaComboboxProps {
  accounts: any[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  error?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function CoaCombobox({ accounts, value, onChange, error, placeholder = "Pilih akun COA...", disabled = false }: CoaComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedAccount = accounts.find((a: any) => a.id === value);

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
          disabled={disabled}
        >
          {selectedAccount ? (
            <span className="truncate flex items-center gap-2">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{selectedAccount.code}</span>
              {selectedAccount.name}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder="Cari kode atau nama akun..." />
          <CommandList>
            <CommandEmpty>Akun tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="text-muted-foreground italic py-3"
              >
                Tidak ada (Kosongkan pilihan)
              </CommandItem>
              {accounts.map((acc: any) => (
                <CommandItem
                  key={acc.id}
                  value={`${acc.code} ${acc.name}`} // Value is used for filtering by CommandInput
                  onSelect={() => {
                    onChange(acc.id === value ? null : acc.id);
                    setOpen(false);
                  }}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{acc.code}</span>
                    <span className="font-medium">{acc.name}</span>
                  </div>
                  {value === acc.id && <Check className="h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
