import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createAttendanceStatusAction, updateAttendanceStatusAction, deleteAttendanceStatusAction } from "../actions/attendance-status-action"
import { attendanceStatusSchema, type AttendanceStatusInput } from "../schemas/attendance-status"

export function useAttendanceStatusForm(initialData?: any, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<AttendanceStatusInput>({
    resolver: zodResolver(attendanceStatusSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  })

  async function onSubmit(values: AttendanceStatusInput) {
    setError(null)
    const result = initialData 
      ? await updateAttendanceStatusAction(initialData.id, values)
      : await createAttendanceStatusAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(initialData ? "Status berhasil diperbarui!" : "Status berhasil ditambahkan!")
      if (!initialData) form.reset()
      if (onSuccess) onSuccess()
    }
  }

  async function onDelete(id: string) {
    setIsDeleting(true)
    const result = await deleteAttendanceStatusAction(id)
    setIsDeleting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Status berhasil dihapus!")
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
