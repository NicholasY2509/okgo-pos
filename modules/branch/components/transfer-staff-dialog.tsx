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
import { ArrowRightLeft, ShieldCheck, Building2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTransferBranchStaff } from "../hooks/use-branch"

interface TransferStaffDialogProps {
  staffId: string
  staffName: string
  currentBranchId?: string
  currentBranchName?: string
  currentRoleId?: string
  branches: { id: string; name: string }[]
  roles: { id: string; name: string }[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultMode?: "role" | "transfer"
}

export function TransferStaffDialog({
  staffId,
  staffName,
  currentBranchId,
  currentBranchName,
  currentRoleId,
  branches,
  roles,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  defaultMode,
}: TransferStaffDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  // Filter available branches so admin cannot choose current branch as target for transfer
  const availableTargetBranches = branches.filter((b) => b.id !== currentBranchId)

  // Determine initial mode
  const getInitialMode = (): "role" | "transfer" => {
    if (defaultMode) return defaultMode
    if (availableTargetBranches.length === 0) return "role"
    return "transfer"
  }

  const [mode, setMode] = useState<"role" | "transfer">(getInitialMode)

  const { form, onSubmit, isSubmitting, error } = useTransferBranchStaff(() => {
    setOpen(false)
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const initialMode = getInitialMode()
      setMode(initialMode)
      form.reset({
        staffId,
        currentBranchId: currentBranchId || "",
        targetBranchId: initialMode === "role" ? (currentBranchId || "") : "",
        roleId: currentRoleId || (roles[0]?.id ?? ""),
      })
    }
    setOpen(nextOpen)
  }

  const handleModeChange = (newMode: "role" | "transfer") => {
    setMode(newMode)
    if (newMode === "role") {
      form.setValue("targetBranchId", currentBranchId || "", { shouldValidate: true })
    } else {
      if (form.getValues("targetBranchId") === currentBranchId) {
        form.setValue("targetBranchId", "", { shouldValidate: false })
      }
    }
    form.clearErrors()
  }

  const isRoleMode = mode === "role"
  const currentRoleName = roles.find((r) => r.id === currentRoleId)?.name

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {defaultMode === "role" ? (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Ubah Peran
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Pindah Cabang
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isRoleMode ? "Ubah Peran Staf di Cabang" : "Pindahkan Staf ke Cabang Lain"}
          </DialogTitle>
          <DialogDescription>
            {isRoleMode ? (
              <>
                Ubah peran penugasan <strong>{staffName}</strong> di cabang{" "}
                <strong>{currentBranchName || "ini"}</strong>.
              </>
            ) : (
              <>
                Pindahkan penugasan <strong>{staffName}</strong> dari cabang saat ini ke cabang tujuan.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {currentBranchId && (
          <Tabs
            value={mode}
            onValueChange={(val) => handleModeChange(val as "role" | "transfer")}
            className="w-full pt-1"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="role" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Ubah Peran
              </TabsTrigger>
              <TabsTrigger
                value="transfer"
                disabled={availableTargetBranches.length === 0}
                className="gap-2"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Pindah Cabang
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {isRoleMode ? (
            <>
              {currentBranchName && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cabang</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md border border-border bg-muted/40 text-sm font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{currentBranchName}</span>
                  </div>
                </div>
              )}

              {currentRoleName && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Peran Saat Ini</Label>
                  <div className="p-2.5 rounded-md border border-border bg-muted/20 text-sm">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                      {currentRoleName}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="roleId">Peran Baru di Cabang Ini</Label>
                <Select
                  value={form.watch("roleId")}
                  onValueChange={(val) => form.setValue("roleId", val, { shouldValidate: true })}
                >
                  <SelectTrigger id="roleId" className="w-full">
                    <SelectValue placeholder="Pilih peran baru..." />
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
            </>
          ) : (
            <>
              {currentBranchName && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cabang Asal</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md border border-border bg-muted/40 text-sm font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{currentBranchName}</span>
                  </div>
                </div>
              )}

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
                    {availableTargetBranches.map((branch) => (
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
            </>
          )}

          {error && (
            <div className="text-xs font-medium text-destructive mt-2" aria-live="polite">
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
              {isSubmitting
                ? isRoleMode
                  ? "Menyimpan..."
                  : "Memindahkan..."
                : isRoleMode
                  ? "Simpan Peran"
                  : "Konfirmasi Pindah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
