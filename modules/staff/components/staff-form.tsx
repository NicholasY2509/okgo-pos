"use client"

import * as React from "react"
import { useCreateStaff } from "../hooks/use-staff"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
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

interface StaffFormProps {
  workPositions: { id: string; name: string }[]
  branches: { id: string; name: string }[]
  onSuccess?: () => void
}

export function StaffForm({ workPositions, branches, onSuccess }: StaffFormProps) {
  const { form, onSubmit, isSubmitting, error } = useCreateStaff(onSuccess)

  const [positionOpen, setPositionOpen] = React.useState(false)
  const [branchOpen, setBranchOpen] = React.useState(false)

  const selectedPositionId = form.watch("workPositionId")
  const selectedBranchId = form.watch("branchId")

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">Nama Depan</label>
          <Input placeholder="Budi" {...form.register("firstName")} />
          {form.formState.errors.firstName && (
            <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">Nama Belakang</label>
          <Input placeholder="Santoso" {...form.register("lastName")} />
          {form.formState.errors.lastName && (
            <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">Telepon (Opsional)</label>
          <Input placeholder="+62 812 3456 7890" {...form.register("phone")} />
        </div>
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">Email (Opsional)</label>
          <Input type="email" placeholder="budi@example.com" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 flex flex-col">
        <label className="text-sm font-medium">Posisi Kerja</label>
        <Popover open={positionOpen} onOpenChange={setPositionOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={positionOpen}
              className={cn(
                "w-full justify-between font-normal",
                !selectedPositionId && "text-muted-foreground"
              )}
            >
              {selectedPositionId
                ? workPositions.find((wp) => wp.id === selectedPositionId)?.name
                : "Pilih posisi..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Cari posisi..." />
              <CommandList>
                <CommandEmpty>Posisi tidak ditemukan.</CommandEmpty>
                <CommandGroup>
                  {workPositions.map((wp) => (
                    <CommandItem
                      key={wp.id}
                      value={wp.name}
                      onSelect={() => {
                        form.setValue("workPositionId", wp.id, { shouldValidate: true })
                        setPositionOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedPositionId === wp.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {wp.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {form.formState.errors.workPositionId && (
          <p className="text-sm text-destructive">{form.formState.errors.workPositionId.message}</p>
        )}
      </div>

      <div className="space-y-2 flex flex-col">
        <label className="text-sm font-medium">Cabang (Opsional)</label>
        <Popover open={branchOpen} onOpenChange={setBranchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={branchOpen}
              className={cn(
                "w-full justify-between font-normal",
                !selectedBranchId && "text-muted-foreground"
              )}
            >
              {selectedBranchId
                ? branches.find((b) => b.id === selectedBranchId)?.name
                : "Pilih cabang (atau biarkan kosong untuk global)..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Cari cabang..." />
              <CommandList>
                <CommandEmpty>Cabang tidak ditemukan.</CommandEmpty>
                <CommandGroup>
                  {branches.map((b) => (
                    <CommandItem
                      key={b.id}
                      value={b.name}
                      onSelect={() => {
                        form.setValue("branchId", b.id, { shouldValidate: true })
                        setBranchOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedBranchId === b.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {b.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {error && (
        <div className="text-sm font-medium text-destructive mt-2" aria-live="polite">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => onSuccess?.()}>Batal</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Membuat..." : "Buat Staf"}
        </Button>
      </div>
    </form>
  )
}
