"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createBranchAction, updateBranchAction } from "../actions/branch-action"
import { createBranchSchema, updateBranchSchema, type CreateBranchInput, type UpdateBranchInput } from "../schemas/branch-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Branch } from "@/lib/generated/prisma"

interface BranchFormProps {
  initialData?: Branch | null;
  onSuccess?: () => void;
}

export function BranchForm({ initialData, onSuccess }: BranchFormProps) {
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!initialData;

  const form = useForm<UpdateBranchInput | CreateBranchInput>({
    resolver: zodResolver(isEditing ? updateBranchSchema : createBranchSchema),
    defaultValues: initialData ? {
      id: initialData.id,
      name: initialData.name,
      subdomain: initialData.subdomain,
      address: initialData.address || "",
      phone: initialData.phone || "",
    } : {
      name: "",
      subdomain: "",
      address: "",
      phone: "",
    },
  })

  async function onSubmit(values: any) {
    setError(null)

    const result = isEditing
      ? await updateBranchAction(values as UpdateBranchInput)
      : await createBranchAction(values as CreateBranchInput)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`Branch ${isEditing ? 'updated' : 'created'} successfully!`)
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
        <Label htmlFor="name">Branch Name</Label>
        <Input
          id="name"
          placeholder="e.g. Downtown Plaza"
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
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="123 Main St..."
          {...form.register("address")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          placeholder="+1 234 567 890"
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
          {isSubmitting ? "Saving..." : isEditing ? "Update Branch" : "Create Branch"}
        </Button>
      </div>
    </form>
  )
}
