"use client"

import { useUserForm } from "../hooks/use-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Role } from "@/lib/generated/prisma"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Controller } from "react-hook-form"

interface UserFormProps {
  initialData?: User & { roleId?: string | null } | null;
  onSuccess?: () => void;
}

export function UserForm({ initialData, onSuccess }: UserFormProps) {
  const { form, onSubmit, isSubmitting, error, isEditing, roles, isLoadingRoles } = useUserForm({ initialData, onSuccess });

  return (
    <form onSubmit={onSubmit} className="space-y-4 py-2">
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
        <Label htmlFor="password">Kata Sandi </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message as string}</p>
        )}
        {isEditing && <p className="text-[12px] text-muted-foreground">Biarkan kosong untuk mempertahankan saat ini</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleId">Role Global (Opsional)</Label>
        <Controller
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoadingRoles}>
              <SelectTrigger id="roleId">
                <SelectValue placeholder={isLoadingRoles ? "Memuat role..." : "Pilih role global (jika ada)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-muted-foreground">Tanpa Role Global</SelectItem>
                {roles.map((role: Role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-[12px] text-muted-foreground">
          Pilih role seperti Super Admin atau Admin Pusat. Jika tidak ada, biarkan kosong.
        </p>
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
