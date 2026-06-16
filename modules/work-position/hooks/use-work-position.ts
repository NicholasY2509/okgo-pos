import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  createWorkPositionAction,
  updateWorkPositionAction,
} from "../actions/work-position-action"
import {
  createWorkPositionSchema,
  updateWorkPositionSchema,
  type CreateWorkPositionInput,
  type UpdateWorkPositionInput,
} from "../schemas/work-position-schema"

export function useCreateWorkPosition(onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateWorkPositionInput>({
    resolver: zodResolver(createWorkPositionSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  async function onSubmit(values: CreateWorkPositionInput) {
    setError(null)
    const result = await createWorkPositionAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Work position created successfully!")
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
