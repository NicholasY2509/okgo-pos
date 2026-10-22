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
import { ArrowRightLeft } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBulkTransferStaff } from "@/modules/branch/hooks/use-branch"

interface BulkTransferStaffDialogProps {
  selectedStaffIds: string[]
  branches: { id: string; name: string }[]
  roles: { id: string; name: string }[]
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function BulkTransferStaffDialog({
  selectedStaffIds,
  branches,
  roles,
  onSuccess,
  trigger,
}: BulkTransferStaffDialogProps) {
  const [open, setOpen] = useState(false)

  const { form, onSubmit, isSubmitting, error } = useBulkTransferStaff(() => {
    setOpen(false)
    onSuccess?.()
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset({
        staffIds: selectedStaffIds,
        targetBranchId: branches[0]?.id || "",
        roleId: roles[0]?.id || "",
      })
    }
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" disabled={selectedStaffIds.length === 0}>
            <ArrowRightLeft className="h-4 w-4 mr-1.5" />
            Pindahkan ke Cabang ({selectedStaffIds.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Pindahkan Staf Terpilih Secara Massal</DialogTitle>
          <DialogDescription>
            Pindahkan <strong>{selectedStaffIds.length} staf</strong> terpilih ke cabang tujuan baru sekaligus.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="targetBranchId">Cabang Tujuan</Label>
            <Select
              value={form.watch("targetBranchId")}
              onValueChange={(val) => form.setValue("targetBranchId", val, { shouldValidate: true })}
            >
              <SelectTrigger id="targetBranchId" className="w-full">
                <SelectValue placeholder="Pilih cabang tujuan..." />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.targetBranchId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.targetBranchId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="roleId">Peran di Cabang Baru</Label>
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
                ? "Memindahkan..."
                : `Konfirmasi Pindahkan (${selectedStaffIds.length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
