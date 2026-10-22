import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  createBranchAction,
  assignStaffToBranchAction,
  bulkAssignStaffAction,
  transferBranchStaffAction,
  bulkTransferStaffAction,
} from "../actions/branch-action"
import {
  createBranchSchema,
  assignStaffBranchSchema,
  bulkAssignStaffSchema,
  transferBranchStaffSchema,
  bulkTransferStaffSchema,
  type CreateBranchInput,
  type AssignStaffBranchInput,
  type BulkAssignStaffInput,
  type TransferBranchStaffInput,
  type BulkTransferStaffInput,
} from "../schemas/branch-schema"

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

export function useAssignStaffBranch(branchId: string, onSuccess?: () => void) {
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
      form.reset({ branchId, staffId: "", roleId: "" })
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

export function useBulkAssignStaff(branchId?: string, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<BulkAssignStaffInput>({
    resolver: zodResolver(bulkAssignStaffSchema),
    defaultValues: {
      branchId: branchId || "",
      roleId: "",
      staffIds: [],
    },
  })

  async function onSubmit(values: BulkAssignStaffInput) {
    setError(null)
    const result = await bulkAssignStaffAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`${values.staffIds.length} staf berhasil ditugaskan ke cabang!`)
      form.reset({ branchId: branchId || "", roleId: "", staffIds: [] })
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

export function useTransferBranchStaff(onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<TransferBranchStaffInput>({
    resolver: zodResolver(transferBranchStaffSchema),
    defaultValues: {
      staffId: "",
      currentBranchId: "",
      targetBranchId: "",
      roleId: "",
    },
  })

  async function onSubmit(values: TransferBranchStaffInput) {
    setError(null)
    const result = await transferBranchStaffAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      const isRoleChangeOnly = values.currentBranchId && values.currentBranchId === values.targetBranchId
      toast.success(
        isRoleChangeOnly
          ? "Peran staf di cabang berhasil diperbarui!"
          : "Staf berhasil dipindahkan ke cabang baru!"
      )
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

export function useBulkTransferStaff(onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<BulkTransferStaffInput>({
    resolver: zodResolver(bulkTransferStaffSchema),
    defaultValues: {
      staffIds: [],
      targetBranchId: "",
      roleId: "",
    },
  })

  async function onSubmit(values: BulkTransferStaffInput) {
    setError(null)
    const result = await bulkTransferStaffAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`${values.staffIds.length} staf berhasil dipindahkan ke cabang baru!`)
      form.reset({ staffIds: [], targetBranchId: "", roleId: "" })
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

