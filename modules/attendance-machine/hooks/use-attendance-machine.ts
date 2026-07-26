import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createMachineAction, updateMachineAction, deleteMachineAction } from "../actions/attendance-machine-action"
import { attendanceMachineSchema, type AttendanceMachineInput } from "../schemas/attendance-machine"

export function useAttendanceMachineForm(initialData?: any, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<AttendanceMachineInput>({
    resolver: zodResolver(attendanceMachineSchema),
    defaultValues: {
      sn: initialData?.sn || "",
      name: initialData?.name || "",
      branchId: initialData?.branchId || "",
      isActive: initialData?.isActive ?? true,
    },
  })

  async function onSubmit(values: AttendanceMachineInput) {
    setError(null)
    const result = initialData
      ? await updateMachineAction(initialData.id, values)
      : await createMachineAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(initialData ? "Mesin berhasil diperbarui!" : "Mesin berhasil ditambahkan!")
      if (!initialData) form.reset()
      if (onSuccess) onSuccess()
    }
  }

  async function onDelete(id: string) {
    setIsDeleting(true)
    const result = await deleteMachineAction(id)
    setIsDeleting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Mesin berhasil dihapus!")
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    onDelete,
    isSubmitting: form.formState.isSubmitting,
    isDeleting,
    error,
  }
}
