import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  createStaffAction,
  updateStaffAction,
} from "../actions/staff-action"
import {
  createStaffSchema,
  updateStaffSchema,
  type CreateStaffInput,
  type UpdateStaffInput,
} from "../schemas/staff-schema"

export function useStaffForm(initialData?: UpdateStaffInput, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialData?.id

  const form = useForm<CreateStaffInput | UpdateStaffInput>({
    resolver: zodResolver(isEditing ? updateStaffSchema : createStaffSchema),
    defaultValues: initialData || {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      isActive: true,
      workPositionId: "",
    },
  })

  async function onSubmit(values: CreateStaffInput | UpdateStaffInput) {
    setError(null)
    const result = isEditing
      ? await updateStaffAction(values as UpdateStaffInput)
      : await createStaffAction(values as CreateStaffInput)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`Anggota staf berhasil ${isEditing ? 'diperbarui' : 'dibuat'}!`)
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
