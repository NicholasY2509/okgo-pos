"use client"

import { useStaffMachineForm } from "../hooks/use-staff-machine"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface StaffMachineFormProps {
  staffId: string
  initialData?: any
  machines: any[]
  onSuccess?: () => void
}

export function StaffMachineForm({ staffId, initialData, machines, onSuccess }: StaffMachineFormProps) {
  const { form, onSubmit, isSubmitting, error } = useStaffMachineForm(staffId, initialData, onSuccess)

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Mesin Absensi</Label>
        <Select 
          onValueChange={(val) => form.setValue("machineId", val)} 
          defaultValue={form.getValues("machineId")}
          disabled={!!initialData}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih mesin absensi..." />
          </SelectTrigger>
          <SelectContent>
            {machines.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.name} ({m.branch?.name})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.machineId && (
          <p className="text-sm text-red-500">{form.formState.errors.machineId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>ID di Mesin (User ID)</Label>
        <Input placeholder="Contoh: 1, 102..." {...form.register("machineUserId")} />
        {form.formState.errors.machineUserId && (
          <p className="text-sm text-red-500">{form.formState.errors.machineUserId.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  )
}
