"use client"

import { useStaffSalary } from "../hooks/use-staff-salary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StaffSalaryInput } from "../schemas/staff-salary-schema"
import { DatePicker } from "@/components/ui/date-picker"
import { Controller } from "react-hook-form"
import { NumericFormat } from "react-number-format"

interface StaffSalaryFormProps {
  staffId: string
  initialData?: StaffSalaryInput & { id: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export function StaffSalaryForm({ staffId, initialData, onSuccess, onCancel }: StaffSalaryFormProps) {
  const { form, onSubmit, isSubmitting, error } = useStaffSalary({
    initialData,
    staffId,
    onSuccess
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Hidden input for staffId since it's passed as prop */}
      <input type="hidden" {...form.register("staffId")} value={staffId} />

      <div className="space-y-2">
        <Label htmlFor="baseSalary">Gaji Pokok</Label>
        <Controller
          control={form.control}
          name="baseSalary"
          render={({ field }) => (
            <NumericFormat
              id="baseSalary"
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              allowNegative={false}
              value={field.value}
              onValueChange={(values) => {
                field.onChange(values.floatValue || 0)
              }}
              placeholder="0"
            />
          )}
        />
        {form.formState.errors.baseSalary && (
          <p className="text-sm text-red-500">{form.formState.errors.baseSalary.message}</p>
        )}
      </div>

      <div className="space-y-2 flex flex-col">
        <Label htmlFor="effectiveDate">Tanggal Berlaku (Effective Date)</Label>
        <Controller
          control={form.control}
          name="effectiveDate"
          render={({ field }) => (
            <DatePicker
              date={field.value}
              setDate={(date) => {
                if (date) field.onChange(date)
              }}
            />
          )}
        />
        {form.formState.errors.effectiveDate && (
          <p className="text-sm text-red-500">{form.formState.errors.effectiveDate.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Gaji ini akan berlaku mulai tanggal yang dipilih.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-4">
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
