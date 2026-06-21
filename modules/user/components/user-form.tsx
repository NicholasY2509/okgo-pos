"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createUserAction, updateUserAction } from "../actions/user-action"
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "../schemas/user-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "@/lib/generated/prisma"

interface UserFormProps {
  initialData?: User | null;
  onSuccess?: () => void;
}

export function UserForm({ initialData, onSuccess }: UserFormProps) {
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!initialData;

  const form = useForm<UpdateUserInput | CreateUserInput>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: initialData ? {
      id: initialData.id,
      name: initialData.name || "",
      email: initialData.email || "",
      password: "",
    } : {
      name: "",
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: any) {
    setError(null)
    
    const result = isEditing 
      ? await updateUserAction(values as UpdateUserInput)
      : await createUserAction(values as CreateUserInput)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`Pengguna berhasil ${isEditing ? 'diperbarui' : 'dibuat'}!`)
      if (!isEditing) {
        form.reset()
      }
      if (onSuccess) {
        onSuccess()
      }
    }
  }

  const { isSubmitting } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input
          id="name"
          placeholder="cth. Budi Santoso"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message as string}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="budi@example.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Kata Sandi {isEditing && "(biarkan kosong untuk mempertahankan saat ini)"}</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message as string}</p>
        )}
      </div>

      {error && (
        <div className="text-sm font-medium text-destructive mt-2" aria-live="polite">
          {error}
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Menyimpan..." : isEditing ? "Perbarui Pengguna" : "Buat Pengguna"}
        </Button>
      </div>
    </form>
  )
}
