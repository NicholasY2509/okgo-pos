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
import { useAttendanceStatusPicker } from "../hooks/use-attendance-status-picker"

interface AttendanceStatusPickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  statusList?: any[]; // Allow providing list directly
}

export function AttendanceStatusPicker({ value, onChange, className, placeholder = "Pilih Status Kehadiran...", statusList: externalStatusList }: AttendanceStatusPickerProps) {
  const { open, setOpen, statusList: fetchedStatusList, loading } = useAttendanceStatusPicker(!externalStatusList);

  const statusList = externalStatusList || fetchedStatusList;
  const isLoading = !externalStatusList && loading;

  const selectedStatus = statusList.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className, !value && "text-muted-foreground")}
        >
          {isLoading ? (
            <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat...</span>
          ) : selectedStatus ? (
            selectedStatus.name
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
        <Command>
          <CommandInput placeholder="Cari status..." />
          <CommandList>
            <CommandEmpty>Status tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {statusList.map((status) => (
                <CommandItem
                  key={status.id}
                  value={status.name}
                  onSelect={() => {
                    onChange(status.id === value ? "" : status.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === status.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {status.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
