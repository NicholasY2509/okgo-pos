"use client"

import { useSalaryComponent } from "../hooks/use-salary-component"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Controller } from "react-hook-form"
import type { UpdateSalaryComponentInput } from "../schemas/salary-component"
import { Checkbox } from "@/components/ui/checkbox"
import { NumericFormat } from "react-number-format"

interface SalaryComponentFormProps {
  defaultValues?: UpdateSalaryComponentInput
  workPositions: { id: string; name: string }[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function SalaryComponentForm({ defaultValues, workPositions = [], onSuccess, onCancel }: SalaryComponentFormProps) {
  const { form, onSubmit, isSubmitting, error } = useSalaryComponent(defaultValues, onSuccess)

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2 sm:col-span-1">
          <Label>Kode</Label>
          <Input {...form.register("code")} placeholder="e.g. UMH" />
          {form.formState.errors.code && (
            <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Nama Komponen</Label>
          <Input {...form.register("name")} placeholder="e.g. Uang Makan Harian" />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Tipe</Label>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Tetap (FIXED)</SelectItem>
                  <SelectItem value="PERCENTAGE">Persentase</SelectItem>
                  <SelectItem value="PER_ATTENDANCE">Per Kehadiran</SelectItem>
                  <SelectItem value="PER_HOUR">Per Jam / Lembur</SelectItem>
                  <SelectItem value="PER_LATE">Per Keterlambatan</SelectItem>
                  <SelectItem value="CONDITIONAL_PERFECT_WEEK">Mingguan Sempurna</SelectItem>
                  <SelectItem value="CONDITIONAL_PERFECT_MONTH">Bulanan Sempurna</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2 sm:col-span-1">
          <Label>Nilai Default</Label>
          <Controller
            control={form.control}
            name="amount"
            render={({ field }) => (
              <NumericFormat
                value={field.value}
                onValueChange={(values) => {
                  field.onChange(values.floatValue || 0)
                }}
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                customInput={Input}
                placeholder="Rp 0"
                allowNegative={false}
              />
            )}
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t mt-4">
        <div>
          <Label className="text-base">Berlaku untuk Posisi Pekerjaan (Opsional)</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Pilih posisi mana saja yang akan otomatis mendapatkan komponen ini secara default.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-52 overflow-y-auto p-4 border rounded-lg bg-muted/30">
          <Controller
            control={form.control}
            name="workPositionIds"
            render={({ field }) => (
              <>
                {workPositions?.map((wp) => (
                  <div key={wp.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`wp-${wp.id}`}
                      checked={field.value?.includes(wp.id)}
                      onCheckedChange={(checked) => {
                        const current = field.value || []
                        const updated = checked
                          ? [...current, wp.id]
                          : current.filter((id) => id !== wp.id)
                        field.onChange(updated)
                      }}
                    />
                    <label
                      htmlFor={`wp-${wp.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {wp.name}
                    </label>
                  </div>
                ))}
              </>
            )}
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <Controller
          control={form.control}
          name="isDeduction"
          render={({ field }) => (
            <div
              className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${field.value ? "bg-red-500/10 border-red-500/20" : "bg-muted/30"
                }`}
            >
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                className={field.value ? "data-[state=checked]:bg-red-500" : ""}
              />
              <div className="space-y-1">
                <Label
                  className="cursor-pointer text-base font-medium leading-none"
                  onClick={() => form.setValue("isDeduction", !field.value)}
                >
                  Jadikan sebagai Potongan (Deduction)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Jika diaktifkan, komponen ini akan mengurangi total gaji (misal: denda, kasbon).
                </p>
              </div>
            </div>
          )}
        />
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
