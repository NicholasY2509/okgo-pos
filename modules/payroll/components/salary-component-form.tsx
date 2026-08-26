"use client"

import { useSalaryComponent } from "../hooks/use-salary-component"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Controller } from "react-hook-form"
import type { UpdateSalaryComponentInput } from "../schemas/salary-component"

interface SalaryComponentFormProps {
  defaultValues?: UpdateSalaryComponentInput
  onSuccess?: () => void
  onCancel?: () => void
}

export function SalaryComponentForm({ defaultValues, onSuccess, onCancel }: SalaryComponentFormProps) {
  const { form, onSubmit, isSubmitting, error } = useSalaryComponent(defaultValues, onSuccess)

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Kode</Label>
          <Input {...form.register("code")} placeholder="e.g. UMH" />
          {form.formState.errors.code && (
            <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Nama Komponen</Label>
          <Input {...form.register("name")} placeholder="e.g. Uang Makan Harian" />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipe</Label>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Tetap (FIXED)</SelectItem>
                  <SelectItem value="PERCENTAGE">Persentase (PERCENTAGE)</SelectItem>
                  <SelectItem value="PER_ATTENDANCE">Per Kehadiran (PER_ATTENDANCE)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Nilai Default</Label>
          <Input 
            type="number" 
            {...form.register("amount", { valueAsNumber: true })} 
            placeholder="0"
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2 pb-2">
        <Controller
          control={form.control}
          name="isDeduction"
          render={({ field }) => (
            <Switch 
              checked={field.value} 
              onCheckedChange={field.onChange} 
            />
          )}
        />
        <Label className="cursor-pointer" onClick={() => form.setValue("isDeduction", !form.getValues("isDeduction"))}>
          Komponen ini adalah Potongan (Deduction)
        </Label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Batal
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  )
}
