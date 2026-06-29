import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createBranchAction, updateBranchAction } from "../actions/branch-action"
import { createBranchSchema, updateBranchSchema, type CreateBranchInput, type UpdateBranchInput } from "../schemas/branch-schema"
import { Branch } from "@/lib/generated/prisma"

interface UseBranchFormProps {
  initialData?: Branch | null;
  onSuccess?: () => void;
}

export function useBranchForm({ initialData, onSuccess }: UseBranchFormProps) {
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

  async function onSubmit(values: UpdateBranchInput | CreateBranchInput) {
    setError(null)

    const result = isEditing
      ? await updateBranchAction(values as UpdateBranchInput)
      : await createBranchAction(values as CreateBranchInput)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`Cabang berhasil ${isEditing ? 'diperbarui' : 'dibuat'}!`)
      if (!isEditing) {
        form.reset()
      }
      if (onSuccess) {
        onSuccess()
      }
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
    isEditing,
  }
}
