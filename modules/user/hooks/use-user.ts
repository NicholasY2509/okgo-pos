import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createUserAction, updateUserAction } from "../actions/user-action"
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "../schemas/user-schema"
import { User } from "@/lib/generated/prisma"

interface UseUserProps {
  initialData?: User | null;
  onSuccess?: () => void;
}

export function useUserForm({ initialData, onSuccess }: UseUserProps) {
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

  async function onSubmit(values: UpdateUserInput | CreateUserInput) {
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

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
    isEditing,
  }
}
