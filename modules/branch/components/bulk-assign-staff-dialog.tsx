"use client"

import { useState, useMemo } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Users, Search, CheckSquare } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBulkAssignStaff } from "../hooks/use-branch"

interface StaffOption {
  id: string
  firstName: string
  lastName: string
  workPosition?: { name: string } | null
  branchStaffs?: { branchId: string; branch?: { name: string } }[]
}

interface BulkAssignStaffDialogProps {
  branchId: string
  branchName: string
  staffs: StaffOption[]
  roles: { id: string; name: string }[]
  trigger?: React.ReactNode
}

export function BulkAssignStaffDialog({
  branchId,
  branchName,
  staffs,
  roles,
  trigger,
}: BulkAssignStaffDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [hideAlreadyAssigned, setHideAlreadyAssigned] = useState(true)

  const { form, onSubmit, isSubmitting, error } = useBulkAssignStaff(branchId, () => {
    setOpen(false)
  })

  const selectedStaffIds = form.watch("staffIds") || []

  // Pre-calculate which staff already assigned
  const alreadyAssignedStaffIds = useMemo(() => {
    const ids = new Set<string>()
    for (const s of staffs) {
      if (s.branchStaffs?.some((bs) => bs.branchId === branchId)) {
        ids.add(s.id)
      }
    }
    return ids
  }, [staffs, branchId])

  // Filtered staff list
  const filteredStaffs = useMemo(() => {
    return staffs.filter((s) => {
      if (hideAlreadyAssigned && alreadyAssignedStaffIds.has(s.id)) {
        return false
      }
      if (!search.trim()) return true
      const term = search.toLowerCase()
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase()
      const pos = s.workPosition?.name?.toLowerCase() || ""
      return fullName.includes(term) || pos.includes(term)
    })
  }, [staffs, search, hideAlreadyAssigned, alreadyAssignedStaffIds])

  const handleToggleSelectAll = () => {
    const selectableIds = filteredStaffs
      .filter((s) => !alreadyAssignedStaffIds.has(s.id))
      .map((s) => s.id)

    const allSelected = selectableIds.every((id) => selectedStaffIds.includes(id))

    if (allSelected) {
      // Deselect all filtered
      const updated = selectedStaffIds.filter((id) => !selectableIds.includes(id))
      form.setValue("staffIds", updated, { shouldValidate: true })
    } else {
      // Select all filtered
      const updated = Array.from(new Set([...selectedStaffIds, ...selectableIds]))
      form.setValue("staffIds", updated, { shouldValidate: true })
    }
  }

  const handleToggleStaff = (id: string) => {
    if (selectedStaffIds.includes(id)) {
      form.setValue(
        "staffIds",
        selectedStaffIds.filter((sid) => sid !== id),
        { shouldValidate: true }
      )
    } else {
      form.setValue("staffIds", [...selectedStaffIds, id], { shouldValidate: true })
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset({
        branchId,
        roleId: roles[0]?.id || "",
        staffIds: [],
      })
      setSearch("")
    }
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Tugaskan Sekaligus (Bulk)
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tugaskan Banyak Staf Sekaligus</DialogTitle>
          <DialogDescription>
            Pilih beberapa staf sekaligus untuk ditugaskan ke cabang <strong>{branchName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 flex flex-col flex-1 overflow-hidden pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="bulkRoleId">Peran yang Ditugaskan</Label>
            <Select
              value={form.watch("roleId")}
              onValueChange={(val) => form.setValue("roleId", val, { shouldValidate: true })}
            >
              <SelectTrigger id="bulkRoleId" className="w-full">
                <SelectValue placeholder="Pilih peran untuk semua staf terpilih..." />
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
              <p className="text-xs text-destructive">{form.formState.errors.roleId.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama staf atau posisi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleSelectAll}
              className="shrink-0 text-xs"
            >
              <CheckSquare className="h-3.5 w-3.5 mr-1" />
              Pilih Semua
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={hideAlreadyAssigned}
                onCheckedChange={(val) => setHideAlreadyAssigned(Boolean(val))}
              />
              <span>Sembunyikan yang sudah di cabang ini</span>
            </label>
            <span className="font-medium text-foreground">
              {selectedStaffIds.length} staf dipilih
            </span>
          </div>

          <div className="border border-border rounded-md flex-1 overflow-y-auto max-h-[300px] divide-y divide-border">
            {filteredStaffs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Tidak ada staf yang cocok dengan kriteria.
              </div>
            ) : (
              filteredStaffs.map((staff) => {
                const isAssigned = alreadyAssignedStaffIds.has(staff.id)
                const isSelected = selectedStaffIds.includes(staff.id)

                return (
                  <div
                    key={staff.id}
                    onClick={() => !isAssigned && handleToggleStaff(staff.id)}
                    className={`flex items-center justify-between p-3 transition-colors ${
                      isAssigned
                        ? "opacity-50 bg-muted/20 cursor-not-allowed"
                        : "cursor-pointer hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        disabled={isAssigned}
                        onCheckedChange={() => !isAssigned && handleToggleStaff(staff.id)}
                      />
                      <div>
                        <div className="text-sm font-medium leading-none">
                          {staff.firstName} {staff.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {staff.workPosition?.name || "Tanpa Posisi"}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isAssigned ? (
                        <Badge variant="secondary" className="text-xs">
                          Sudah di Cabang Ini
                        </Badge>
                      ) : staff.branchStaffs && staff.branchStaffs.length > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {staff.branchStaffs.map((bs) => bs.branch?.name).filter(Boolean).join(", ")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Global</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {form.formState.errors.staffIds && (
            <p className="text-xs text-destructive">
              {form.formState.errors.staffIds.message}
            </p>
          )}

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
                : `Tugaskan ${selectedStaffIds.length} Staf`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
