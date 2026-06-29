"use client";

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useStaffCombobox } from "../hooks/use-staff-combobox"

interface StaffComboboxProps {
  value: string;
  onChange: (value: string) => void;
  branchId?: string;
  className?: string;
}

export function StaffCombobox({ value, onChange, branchId, className }: StaffComboboxProps) {
  const { open, setOpen, staffList, loading } = useStaffCombobox(branchId);


  const selectedStaff = staffList.find((s) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          {loading ? (
            <span className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat...</span>
          ) : selectedStaff ? (
            `${selectedStaff.firstName} ${selectedStaff.lastName}`
          ) : (
            <span className="text-muted-foreground">Pilih Terapis</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder="Cari terapis..." />
          <CommandList>
            <CommandEmpty>Terapis tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {staffList.map((staff) => (
                <CommandItem
                  key={staff.id}
                  value={`${staff.firstName} ${staff.lastName}`}
                  onSelect={() => {
                    onChange(staff.id === value ? "" : staff.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === staff.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {staff.firstName} {staff.lastName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
