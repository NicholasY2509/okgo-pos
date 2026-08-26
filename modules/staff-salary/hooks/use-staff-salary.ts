import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createStaffSalaryAction, updateStaffSalaryAction, deleteStaffSalaryAction } from "../actions/staff-salary-action"
import { staffSalarySchema, type StaffSalaryInput } from "../schemas/staff-salary-schema"

interface UseStaffSalaryProps {
  staffId?: string
  initialData?: StaffSalaryInput & { id: string }
  onSuccess?: () => void
}

export function useStaffSalary({ initialData, staffId, onSuccess }: UseStaffSalaryProps = {}) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<StaffSalaryInput>({
    resolver: zodResolver(staffSalarySchema) as any,
    defaultValues: initialData || {
      staffId: staffId || "",
      baseSalary: 0,
      effectiveDate: new Date(),
    },
  })

  async function onSubmit(values: StaffSalaryInput) {
    setError(null)
    
    let result;
    if (initialData?.id) {
      // The user wants historical tracking, so typically editing a salary 
      // might mean we still just create a new record if they change effectiveDate,
      // but if we are editing an existing record, we update it.
      // Usually, in a historical system, we just insert a new record for a new salary.
      // For now, let's treat update as fixing a typo in the existing record.
      result = await updateStaffSalaryAction(initialData.id, values)
    } else {
      result = await createStaffSalaryAction(values)
    }

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(initialData?.id ? "Gaji berhasil diperbarui!" : "Gaji berhasil ditambahkan!")
      if (!initialData) {
        form.reset({
            staffId: "",
            baseSalary: 0,
            effectiveDate: new Date(),
        })
      }
      if (onSuccess) onSuccess()
    }
  }

  async function onDelete(id: string) {
    setIsDeleting(true)
    const result = await deleteStaffSalaryAction(id)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Riwayat gaji berhasil dihapus!")
      if (onSuccess) onSuccess()
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    isDeleting,
    error,
    onDelete
  }
}
