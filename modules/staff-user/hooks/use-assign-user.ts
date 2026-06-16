import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { linkUserToStaffAction } from "../actions/staff-user-action"
import { createStaffUserSchema, type CreateStaffUserInput } from "../schemas/staff-user-schema"

export function useAssignUser(staffId: string, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateStaffUserInput>({
    resolver: zodResolver(createStaffUserSchema),
    defaultValues: {
      staffId: staffId,
      userId: "",
    },
  })

  async function onSubmit(values: CreateStaffUserInput) {
    setError(null)
    const result = await linkUserToStaffAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("User successfully assigned to staff!")
      form.reset()
      onSuccess?.()
    }

    return result
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  }
}
