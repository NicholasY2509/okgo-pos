"use client"

import { useBranchForm } from "../hooks/use-branch-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Branch } from "@/lib/generated/prisma"

interface BranchFormProps {
  initialData?: Branch | null;
  onSuccess?: () => void;
}

export function BranchForm({ initialData, onSuccess }: BranchFormProps) {
  const { form, onSubmit, isSubmitting, error, isEditing } = useBranchForm({ initialData, onSuccess });


  return (
    <form onSubmit={onSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Cabang</Label>
        <Input
          id="name"
          placeholder="cth. Plaza Pusat Kota"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subdomain">Subdomain</Label>
        <div className="flex items-center gap-2">
          <Input
            id="subdomain"
            placeholder="downtown"
            {...form.register("subdomain")}
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">.nyenyak.com</span>
        </div>
        {form.formState.errors.subdomain && (
          <p className="text-sm text-destructive">{form.formState.errors.subdomain.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Alamat</Label>
        <Input
          id="address"
          placeholder="Jl. Sudirman No. 123..."
          {...form.register("address")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Nomor Telepon</Label>
        <Input
          id="phone"
          placeholder="+62 812 3456 7890"
          {...form.register("phone")}
        />
      </div>

      {error && (
        <div className="text-sm font-medium text-destructive mt-2" aria-live="polite">
          {error}
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Menyimpan..." : isEditing ? "Perbarui Cabang" : "Buat Cabang"}
        </Button>
      </div>
    </form>
  )
}
