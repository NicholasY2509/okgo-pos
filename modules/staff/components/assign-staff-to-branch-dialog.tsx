"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAssignStaffBranch } from "@/modules/branch/hooks/use-branch"

interface AssignStaffToBranchDialogProps {
  staffId: string
  staffName: string
  branches: { id: string; name: string }[]
  roles: { id: string; name: string }[]
  existingBranchIds?: string[]
  trigger?: React.ReactNode
}

export function AssignStaffToBranchDialog({
  staffId,
  staffName,
  branches,
  roles,
  existingBranchIds = [],
  trigger,
}: AssignStaffToBranchDialogProps) {
  const [open, setOpen] = useState(false)

  // Filter out branches where staff is already assigned
  const availableBranches = branches.filter((b) => !existingBranchIds.includes(b.id))

  const { form, onSubmit, isSubmitting, error } = useAssignStaffBranch(
    availableBranches[0]?.id || "",
    () => {
      setOpen(false)
    }
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset({
        branchId: availableBranches[0]?.id || "",
        staffId,
        roleId: roles[0]?.id || "",
      })
    }
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Tugaskan ke Cabang
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Tugaskan Staf ke Cabang</DialogTitle>
          <DialogDescription>
            Pilih cabang dan peran untuk menugaskan <strong>{staffName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {availableBranches.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Staf ini sudah ditugaskan ke seluruh cabang yang tersedia.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="branchId">Cabang</Label>
              <Select
                value={form.watch("branchId")}
                onValueChange={(val) => form.setValue("branchId", val, { shouldValidate: true })}
              >
                <SelectTrigger id="branchId" className="w-full">
                  <SelectValue placeholder="Pilih cabang..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.branchId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.branchId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roleId">Peran di Cabang</Label>
              <Select
                value={form.watch("roleId")}
                onValueChange={(val) => form.setValue("roleId", val, { shouldValidate: true })}
              >
                <SelectTrigger id="roleId" className="w-full">
                  <SelectValue placeholder="Pilih peran..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.roleId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.roleId.message}
                </p>
              )}
            </div>

            {error && (
              <div className="text-xs font-medium text-destructive mt-1" aria-live="polite">
                {error}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menugaskan..." : "Tugaskan Staf"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
