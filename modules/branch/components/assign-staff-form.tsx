"use client"

import * as React from "react"
import { useAssignStaffBranch } from "../hooks/use-branch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { Staff, WorkPosition } from "@/lib/generated/prisma"

interface AssignStaffFormProps {
  branchId: string
  staffs: (Staff & { workPosition: WorkPosition })[]
  roles: { id: string; name: string }[]
}

export function AssignStaffForm({ branchId, staffs, roles }: AssignStaffFormProps) {
  const { form, onSubmit, isSubmitting, error } = useAssignStaffBranch(branchId)

  const [staffOpen, setStaffOpen] = React.useState(false)
  const [roleOpen, setRoleOpen] = React.useState(false)

  const selectedStaffId = form.watch("staffId")
  const selectedRoleId = form.watch("roleId")

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Tugaskan Staf</CardTitle>
        <CardDescription>Tugaskan staf ke cabang ini dengan peran tertentu.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium">Staf</label>
            <Popover open={staffOpen} onOpenChange={setStaffOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={staffOpen}
                  className={cn(
                    "w-full justify-between font-normal",
                    !selectedStaffId && "text-muted-foreground"
                  )}
                >
                  {selectedStaffId
                    ? (() => {
                        const s = staffs.find((staff) => staff.id === selectedStaffId)
                        return s ? `${s.firstName} ${s.lastName} (${s.workPosition.name})` : "Pilih staf..."
                      })()
                    : "Pilih staf..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari staf..." />
                  <CommandList>
                    <CommandEmpty>Staf tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {staffs.map((staff) => (
                        <CommandItem
                          key={staff.id}
                          value={`${staff.firstName} ${staff.lastName}`}
                          onSelect={() => {
                            form.setValue("staffId", staff.id, { shouldValidate: true })
                            setStaffOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStaffId === staff.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {staff.firstName} {staff.lastName}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {staff.workPosition.name}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.staffId && (
              <p className="text-sm text-destructive">{form.formState.errors.staffId.message as string}</p>
            )}
          </div>

          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium">Peran</label>
            <Popover open={roleOpen} onOpenChange={setRoleOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={roleOpen}
                  className={cn(
                    "w-full justify-between font-normal",
                    !selectedRoleId && "text-muted-foreground"
                  )}
                >
                  {selectedRoleId
                    ? roles.find((role) => role.id === selectedRoleId)?.name
                    : "Pilih peran..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari peran..." />
                  <CommandList>
                    <CommandEmpty>Peran tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {roles.map((role) => (
                        <CommandItem
                          key={role.id}
                          value={role.name || role.id}
                          onSelect={() => {
                            form.setValue("roleId", role.id, { shouldValidate: true })
                            setRoleOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRoleId === role.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {role.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.roleId && (
              <p className="text-sm text-destructive">{form.formState.errors.roleId.message as string}</p>
            )}
          </div>

          {error && (
            <div className="text-sm font-medium text-destructive mt-2" aria-live="polite">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menugaskan..." : "Tugaskan Staf"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
