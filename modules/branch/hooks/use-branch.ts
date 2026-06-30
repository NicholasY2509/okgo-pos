import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createBranchAction, assignStaffToBranchAction } from "../actions/branch-action"
import { createBranchSchema, assignStaffBranchSchema, type CreateBranchInput, type AssignStaffBranchInput } from "../schemas/branch-schema"

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
      toast.success("Cabang berhasil dibuat!")
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

export function useAssignStaffBranch(branchId: string) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AssignStaffBranchInput>({
    resolver: zodResolver(assignStaffBranchSchema),
    defaultValues: {
      branchId,
      staffId: "",
      roleId: "",
    },
  })

  async function onSubmit(values: AssignStaffBranchInput) {
    setError(null)
    const result = await assignStaffToBranchAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Staf berhasil ditugaskan ke cabang!")
      form.reset({ branchId, staffId: "", roleId: "" }) // Keep branchId, reset the rest
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
