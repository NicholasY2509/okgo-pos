"use client";

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"

interface StaffMultiPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  branchId?: string;
  className?: string;
}

export function StaffMultiPicker({ value, onChange, branchId, className }: StaffMultiPickerProps) {
  const { open, setOpen, staffList, loading } = useStaffCombobox(branchId);

  const selectedStaff = staffList.filter((s) => value.includes(s.id));

  const toggleStaff = (staffId: string) => {
    if (value.includes(staffId)) {
      onChange(value.filter((id) => id !== staffId));
    } else {
      onChange([...value, staffId]);
    }
  };

  const removeStaff = (staffId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((id) => id !== staffId));
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-auto min-h-10 py-1.5 px-3", className)}
        >
          {loading ? (
            <span className="flex items-center text-muted-foreground py-1"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat...</span>
          ) : selectedStaff.length > 0 ? (
            <div className="flex flex-wrap gap-1 items-center">
              {selectedStaff.map(staff => (
                <Badge key={staff.id} variant="secondary" className="mr-1 mb-1 font-normal text-xs flex items-center gap-1">
                  {staff.firstName} {staff.lastName}
                  <div 
                    role="button"
                    tabIndex={0}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        removeStaff(staff.id, e as any);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => removeStaff(staff.id, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground py-1">Pilih Staf...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 self-start mt-1.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
        <Command>
          <CommandInput placeholder="Cari staf..." />
          <CommandList>
            <CommandEmpty>Staf tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {staffList.map((staff) => {
                const isSelected = value.includes(staff.id);
                return (
                  <CommandItem
                    key={staff.id}
                    value={`${staff.firstName} ${staff.lastName}`}
                    onSelect={() => toggleStaff(staff.id)}
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}>
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    {staff.firstName} {staff.lastName}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
