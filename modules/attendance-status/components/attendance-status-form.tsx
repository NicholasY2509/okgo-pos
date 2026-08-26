"use client"

import { useAttendanceStatusForm } from "../hooks/use-attendance-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Controller } from "react-hook-form"
import { NumericFormat } from "react-number-format"

interface AttendanceStatusFormProps {
  initialData?: any
  onSuccess?: () => void
}

export function AttendanceStatusForm({ initialData, onSuccess }: AttendanceStatusFormProps) {
  const { form, onSubmit, isSubmitting, error } = useAttendanceStatusForm(initialData, onSuccess)

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Kode Status</Label>
        <Input placeholder="Contoh: PRESENT, LATE, ABSENT..." {...form.register("code")} disabled={!!initialData} />
        {form.formState.errors.code && (
          <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Nama Status</Label>
        <Input placeholder="Contoh: Hadir, Terlambat..." {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Deskripsi (Opsional)</Label>
        <Textarea placeholder="Catatan tambahan..." {...form.register("description")} />
      </div>

      <div className="space-y-4 border p-4 rounded-md mt-6">
        <div className="flex items-center space-x-2">
          <Controller
            control={form.control}
            name="isPenaltyApplicable"
            render={({ field }) => (
              <Checkbox id="penalty-applicable" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label htmlFor="penalty-applicable" className="cursor-pointer">Terapkan Penalti untuk Status Ini</Label>
        </div>

        {form.watch("isPenaltyApplicable") && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Tipe Penalti</Label>
              <Controller
                control={form.control}
                name="penaltyType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || "FIXED"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Nominal Tetap (Rp)</SelectItem>
                      <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Nominal Penalti</Label>
              <Controller
                control={form.control}
                name="penaltyAmount"
                render={({ field }) => (
                  <NumericFormat
                    customInput={Input}
                    allowNegative={false}
                    thousandSeparator="."
                    decimalSeparator=","
                    value={field.value || ""}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue || 0)
                    }}
                    placeholder="0"
                  />
                )}
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 font-medium mt-4">{error}</p>}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  )
}
