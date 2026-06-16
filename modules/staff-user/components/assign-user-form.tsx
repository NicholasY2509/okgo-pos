"use client"

import * as React from "react"
import { useAssignUser } from "../hooks/use-assign-user"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"

interface AssignUserFormProps {
  staffId: string
  users: { id: string; name: string | null; email: string | null }[]
  onSuccess?: () => void
}

export function AssignUserForm({ staffId, users, onSuccess }: AssignUserFormProps) {
  const { form, onSubmit, isSubmitting, error } = useAssignUser(staffId, onSuccess)
  const [open, setOpen] = React.useState(false)

  const selectedUserId = form.watch("userId")

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-2 flex flex-col">
        <label className="text-sm font-medium">Select User</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between font-normal",
                !selectedUserId && "text-muted-foreground"
              )}
            >
              {selectedUserId
                ? users.find((user) => user.id === selectedUserId)?.name || users.find((user) => user.id === selectedUserId)?.email
                : "Select user account..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search user..." />
              <CommandList>
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.name || user.email || user.id}
                      onSelect={() => {
                        form.setValue("userId", user.id, { shouldValidate: true })
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedUserId === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {user.name} <span className="text-muted-foreground text-xs ml-2">({user.email})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {form.formState.errors.userId && (
          <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>
        )}
      </div>
      
      {error && (
        <div className="text-sm font-medium text-destructive mt-2" aria-live="polite">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => onSuccess?.()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Assigning..." : "Assign User"}
        </Button>
      </div>
    </form>
  )
}
