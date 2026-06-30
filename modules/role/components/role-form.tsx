"use client"

import * as React from "react"
import { useRoleForm } from "../hooks/use-role"
import { UpdateRoleInput } from "../schemas/role-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface RoleFormProps {
  initialData?: UpdateRoleInput
  onSuccess?: () => void
}

export function RoleForm({ initialData, onSuccess }: RoleFormProps) {
  const { form, onSubmit, isSubmitting, error, isEditing } = useRoleForm(initialData, onSuccess)

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2 flex flex-col">
        <label className="text-sm font-medium">Nama Role</label>
        <Input placeholder="Admin, Cashier, dll." {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2 flex flex-col">
        <label className="text-sm font-medium">Deskripsi (Opsional)</label>
        <Textarea placeholder="Deskripsi singkat role ini..." {...form.register("description")} />
      </div>

      {error && (
        <div className="text-sm font-medium text-destructive mt-2" aria-live="polite">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onSuccess?.()}>Batal</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Buat Role")}
        </Button>
      </div>
    </form>
  )
}
