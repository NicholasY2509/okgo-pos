"use client"

import * as React from "react"
import { useAssignUserBranch } from "../hooks/use-branch"
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

interface AssignUserFormProps {
  branchId: string
  users: { id: string; name: string | null; email: string | null }[]
  roles: { id: string; name: string }[]
}

export function AssignUserForm({ branchId, users, roles }: AssignUserFormProps) {
  const { form, onSubmit, isSubmitting, error } = useAssignUserBranch(branchId)

  const [userOpen, setUserOpen] = React.useState(false)
  const [roleOpen, setRoleOpen] = React.useState(false)

  const selectedUserId = form.watch("userId")
  const selectedRoleId = form.watch("roleId")

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Assign User</CardTitle>
        <CardDescription>Assign a user to this branch with a specific role.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium">User</label>
            <Popover open={userOpen} onOpenChange={setUserOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userOpen}
                  className={cn(
                    "w-full justify-between font-normal",
                    !selectedUserId && "text-muted-foreground"
                  )}
                >
                  {selectedUserId
                    ? users.find((user) => user.id === selectedUserId)?.name || users.find((user) => user.id === selectedUserId)?.email
                    : "Select a user..."}
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
                            setUserOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUserId === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {user.name || user.email}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.userId && (
              <p className="text-sm text-destructive">{form.formState.errors.userId.message as string}</p>
            )}
          </div>

          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium">Role</label>
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
                    : "Select a role..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search role..." />
                  <CommandList>
                    <CommandEmpty>No role found.</CommandEmpty>
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
            {isSubmitting ? "Assigning..." : "Assign User"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
