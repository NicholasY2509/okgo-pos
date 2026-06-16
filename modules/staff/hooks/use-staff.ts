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

export function useCreateStaff(onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      isActive: true,
      workPositionId: "",
      branchId: "",
    },
  })

  async function onSubmit(values: CreateStaffInput) {
    setError(null)
    const result = await createStaffAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Staff member created successfully!")
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
