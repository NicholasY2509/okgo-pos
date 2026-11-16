import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { updateBranchSettingsAction } from "../actions/branch-action"
import {
  updateBranchSettingsSchema,
  type UpdateBranchSettingsInput,
} from "../schemas/branch-schema"

interface UseBranchSettingsProps {
  branchId: string
  initialMaxDailyBookings: number | null
}

/**
 * Manages branch booking quota settings form state and submission.
 */
export function useBranchSettings({
  branchId,
  initialMaxDailyBookings,
}: UseBranchSettingsProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLimitEnabled, setIsLimitEnabled] = useState<boolean>(
    initialMaxDailyBookings !== null && initialMaxDailyBookings > 0
  )

  const form = useForm<UpdateBranchSettingsInput>({
    resolver: zodResolver(updateBranchSettingsSchema),
    defaultValues: {
      branchId,
      maxDailyBookings: initialMaxDailyBookings,
    },
  })

  function handleToggleLimit(enabled: boolean) {
    setIsLimitEnabled(enabled)
    setError(null)
    if (!enabled) {
      form.setValue("maxDailyBookings", null, { shouldValidate: true })
    } else {
      const current = form.getValues("maxDailyBookings")
      form.setValue("maxDailyBookings", current && current > 0 ? current : 10, {
        shouldValidate: true,
      })
    }
  }

  async function onSubmit(values: UpdateBranchSettingsInput) {
    setError(null)
    if (isLimitEnabled && (values.maxDailyBookings === null || values.maxDailyBookings < 1)) {
      form.setError("maxDailyBookings", {
        type: "manual",
        message: "Maksimal slot booking wajib diisi (minimal 1)",
      })
      return
    }

    const payload: UpdateBranchSettingsInput = {
      branchId: values.branchId,
      maxDailyBookings: isLimitEnabled ? values.maxDailyBookings : null,
    }

    const result = await updateBranchSettingsAction(payload)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Pengaturan cabang berhasil disimpan!")
    }
  }

  return {
    form,
    isLimitEnabled,
    handleToggleLimit,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  }
}
