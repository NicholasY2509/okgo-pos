"use client"

import * as React from "react"
import { useCreateWorkPosition } from "../hooks/use-work-position"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function WorkPositionForm({ onSuccess }: { onSuccess?: () => void }) {
  const { form, onSubmit, isSubmitting, error } = useCreateWorkPosition(onSuccess)

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
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
          {isSubmitting ? "Membuat..." : "Buat Posisi"}
        </Button>
      </div>
    </form>
  )
}
