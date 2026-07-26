"use client"

import { useAttendanceStatusForm } from "../hooks/use-attendance-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  )
}
