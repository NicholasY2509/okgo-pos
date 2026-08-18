import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createPromotionAction, updatePromotionAction, deletePromotionAction } from "../actions/promotion-action"
import { promotionSchema, type PromotionInput } from "../schemas/promotion"

export function usePromotionForm(initialData?: any, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const defaultValues: PromotionInput = initialData ? {
    name: initialData.name,
    description: initialData.description || null,
    isActive: initialData.isActive,
    branchId: initialData.branchId || null,
    schedules: initialData.schedules || [{ days: [], startTime: "09:00", endTime: "22:00" }],
    conditions: initialData.conditions || undefined,
    reward: initialData.reward || { type: "PERCENTAGE_TOTAL", value: 0 },
  } : {
    name: "",
    description: null,
    isActive: true,
    branchId: null,
    schedules: [{ days: [], startTime: "09:00", endTime: "22:00" }],
    conditions: undefined,
    reward: { type: "PERCENTAGE_TOTAL", value: 0 },
  }

  const form = useForm<PromotionInput>({
    resolver: zodResolver(promotionSchema),
    defaultValues,
  })

  // We expose field arrays for schedules so the UI can add/remove them dynamically
  const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({
    control: form.control,
    name: "schedules",
  })

  async function onSubmit(values: PromotionInput) {
    setError(null)
    const action = initialData ? updatePromotionAction.bind(null, initialData.id) : createPromotionAction
    const result = await action(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(initialData ? "Promo berhasil diperbarui!" : "Promo berhasil dibuat!")
      if (!initialData) form.reset()
      onSuccess?.()
    }
  }

  return {
    form,
    scheduleFields,
    appendSchedule,
    removeSchedule,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  }
}

export function useDeletePromotion() {
  const [isDeleting, setIsDeleting] = useState(false)

  async function onDelete(id: string, onSuccess?: () => void) {
    setIsDeleting(true)
    const result = await deletePromotionAction(id)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Promo berhasil dihapus!")
      onSuccess?.()
    }
  }

  return { onDelete, isDeleting }
}
