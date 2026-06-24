import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createDiscountAction, updateDiscountAction, deleteDiscountAction } from "../actions/discount-action"
import { discountSchema, type DiscountInput } from "../schemas/discount"
import { Discount } from "../types/discount"

export function useDiscountForm(initialData?: Discount, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<DiscountInput>({
    resolver: zodResolver(discountSchema) as any,
    defaultValues: initialData ? {
      name: initialData.name,
      dayOfWeek: initialData.dayOfWeek as any,
      startTime: initialData.startTime,
      endTime: initialData.endTime,
      percentage: Number(initialData.percentage),
      isActive: initialData.isActive,
      branchId: initialData.branchId
    } : {
      name: "",
      dayOfWeek: "MONDAY",
      startTime: "00:00",
      endTime: "23:59",
      percentage: 0,
      isActive: true,
      branchId: null
    },
  })

  async function onSubmit(values: DiscountInput) {
    setError(null)
    const result = initialData
      ? await updateDiscountAction(initialData.id, values)
      : await createDiscountAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      return { success: false }
    } else {
      toast.success(initialData ? "Berhasil diperbarui!" : "Berhasil dibuat!")
      if (!initialData) form.reset()
      if (onSuccess) onSuccess()
      return { success: true }
    }
  }

  async function onDelete(id: string) {
    setError(null)
    const result = await deleteDiscountAction(id)
    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      return { success: false }
    } else {
      toast.success("Berhasil dihapus!")
      return { success: true }
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    onDelete,
    isSubmitting: form.formState.isSubmitting,
    error,
  }
}
