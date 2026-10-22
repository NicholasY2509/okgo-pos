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
import { Users } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBulkAssignStaff } from "@/modules/branch/hooks/use-branch"

interface BulkAssignStaffModalProps {
  selectedStaffIds: string[]
  branches: { id: string; name: string }[]
  roles: { id: string; name: string }[]
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function BulkAssignStaffModal({
  selectedStaffIds,
  branches,
  roles,
  onSuccess,
  trigger,
}: BulkAssignStaffModalProps) {
  const [open, setOpen] = useState(false)

  const { form, onSubmit, isSubmitting, error } = useBulkAssignStaff("", () => {
    setOpen(false)
    onSuccess?.()
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset({
        staffIds: selectedStaffIds,
        branchId: branches[0]?.id || "",
        roleId: roles[0]?.id || "",
      })
    }
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" disabled={selectedStaffIds.length === 0}>
            <Users className="h-4 w-4 mr-1.5" />
            Tugaskan ke Cabang ({selectedStaffIds.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Tugaskan Staf Terpilih ke Cabang</DialogTitle>
          <DialogDescription>
            Tugaskan <strong>{selectedStaffIds.length} staf</strong> terpilih ke cabang dan peran tertentu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="branchId">Cabang Tujuan</Label>
            <Select
              value={form.watch("branchId")}
              onValueChange={(val) => form.setValue("branchId", val, { shouldValidate: true })}
            >
              <SelectTrigger id="branchId" className="w-full">
                <SelectValue placeholder="Pilih cabang..." />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
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
            <Label htmlFor="roleId">Peran</Label>
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
            <Button
              type="submit"
              disabled={isSubmitting || selectedStaffIds.length === 0}
            >
              {isSubmitting
                ? "Menugaskan..."
                : `Tugaskan (${selectedStaffIds.length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
