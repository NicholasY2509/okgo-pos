import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createBranchAction, assignUserToBranchAction } from "../actions/branch-action"
import { createBranchSchema, assignUserBranchSchema, type CreateBranchInput, type AssignUserBranchInput } from "../schemas/branch-schema"

export function useCreateBranch() {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateBranchInput>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      address: "",
      phone: "",
    },
  })

  async function onSubmit(values: CreateBranchInput) {
    setError(null)
    const result = await createBranchAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Branch created successfully!")
      form.reset()
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

export function useAssignUserBranch(branchId: string) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AssignUserBranchInput>({
    resolver: zodResolver(assignUserBranchSchema),
    defaultValues: {
      branchId,
      userId: "",
      roleId: "",
    },
  })

  async function onSubmit(values: AssignUserBranchInput) {
    setError(null)
    const result = await assignUserToBranchAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("User assigned to branch successfully!")
      form.reset({ branchId, userId: "", roleId: "" }) // Keep branchId, reset the rest
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
