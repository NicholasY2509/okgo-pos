"use client"

import { useAttendanceMachineForm } from "../hooks/use-attendance-machine"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface MachineFormProps {
  initialData?: any
  branches: { id: string; name: string }[]
  onSuccess?: () => void
}

export function MachineForm({ initialData, branches, onSuccess }: MachineFormProps) {
  const { form, onSubmit, isSubmitting, error } = useAttendanceMachineForm(initialData, onSuccess)

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Serial Number Mesin</Label>
        <Input placeholder="Contoh: AD213423..." {...form.register("sn")} />
        {form.formState.errors.sn && (
          <p className="text-sm text-red-500">{form.formState.errors.sn.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Nama Mesin</Label>
        <Input placeholder="Contoh: Mesin Pintu Utama" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Cabang Penempatan</Label>
        <Select 
          onValueChange={(val) => form.setValue("branchId", val)} 
          defaultValue={form.getValues("branchId")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih cabang..." />
          </SelectTrigger>
          <SelectContent>
            {branches.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.branchId && (
          <p className="text-sm text-red-500">{form.formState.errors.branchId.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="isActive" 
          checked={form.watch("isActive")}
          onCheckedChange={(val) => form.setValue("isActive", val as boolean)}
        />
        <Label htmlFor="isActive">Mesin Aktif</Label>
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
