import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createSalaryComponentAction, updateSalaryComponentAction, deleteSalaryComponentAction } from "../actions/salary-component-action"
import { salaryComponentSchema, type SalaryComponentInput, type UpdateSalaryComponentInput } from "../schemas/salary-component"

export function useSalaryComponent(defaultValues?: UpdateSalaryComponentInput, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!defaultValues

  const form = useForm<SalaryComponentInput>({
    resolver: zodResolver(salaryComponentSchema) as any,
    defaultValues: defaultValues || ({
      code: "",
      name: "",
      isDeduction: false,
      type: "FIXED",
      amount: 0,
      workPositionIds: []
    } as SalaryComponentInput),
  })

  async function onSubmit(values: SalaryComponentInput) {
    setError(null)

    const result = (isEditing && defaultValues?.id)
      ? await updateSalaryComponentAction({ ...values, id: defaultValues.id })
      : await createSalaryComponentAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      return false
    } else {
      toast.success(isEditing ? "Komponen berhasil diubah!" : "Komponen berhasil dibuat!")
      if (onSuccess) {
        onSuccess()
      } else {
        if (!isEditing) form.reset()
      }
      return true
    }
  }

  async function onDelete(id: string) {
    const result = await deleteSalaryComponentAction(id)
    if (result.error) {
      toast.error(result.error)
      return false
    } else {
      toast.success("Komponen berhasil dihapus!")
      return true
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
