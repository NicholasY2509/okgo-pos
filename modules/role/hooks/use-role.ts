import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  createRoleAction,
  updateRoleAction,
} from "../actions/role-action"
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
} from "../schemas/role-schema"

export function useRoleForm(initialData?: UpdateRoleInput, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)
  
  const isEditing = !!initialData?.id

  const form = useForm<CreateRoleInput | UpdateRoleInput>({
    resolver: zodResolver(isEditing ? updateRoleSchema : createRoleSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
    },
  })

  async function onSubmit(values: CreateRoleInput | UpdateRoleInput) {
    setError(null)
    const result = isEditing 
      ? await updateRoleAction(values as UpdateRoleInput)
      : await createRoleAction(values as CreateRoleInput)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`Role berhasil ${isEditing ? 'diperbarui' : 'dibuat'}!`)
      if (!isEditing) form.reset()
      onSuccess?.()
    }

    return result
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
    isEditing,
  }
}
