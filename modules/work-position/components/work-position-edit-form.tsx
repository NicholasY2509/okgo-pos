"use client"

import * as React from "react"
import { useUpdateWorkPosition } from "../hooks/use-work-position"
import { type UpdateWorkPositionInput } from "../schemas/work-position-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function WorkPositionEditForm({ 
  initialData, 
  onSuccess 
}: { 
  initialData: UpdateWorkPositionInput, 
  onSuccess?: () => void 
}) {
  const { form, onSubmit, isSubmitting, error } = useUpdateWorkPosition(initialData, onSuccess)

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2 flex flex-col">
        <label className="text-sm font-medium">Nama</label>
        <Input
          placeholder="cth. Terapis, Resepsionis"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2 flex flex-col">
        <label className="text-sm font-medium">Deskripsi (Opsional)</label>
        <Textarea
          placeholder="Jelaskan secara singkat tanggung jawabnya..."
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      {error && (
        <div className="text-sm font-medium text-destructive mt-2" aria-live="polite">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => onSuccess?.()}>Batal</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  )
}
