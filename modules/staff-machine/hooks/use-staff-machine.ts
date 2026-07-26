import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createStaffMachineAction, updateStaffMachineAction, deleteStaffMachineAction } from "../actions/staff-machine-action"
import { staffMachineSchema, type StaffMachineInput } from "../schemas/staff-machine"

export function useStaffMachineForm(staffId: string, initialData?: any, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<StaffMachineInput>({
    resolver: zodResolver(staffMachineSchema),
    defaultValues: {
      staffId: staffId,
      machineId: initialData?.machineId || "",
      machineUserId: initialData?.machineUserId || "",
    },
  })

  async function onSubmit(values: StaffMachineInput) {
    setError(null)
    const result = initialData 
      ? await updateStaffMachineAction(initialData.id, values)
      : await createStaffMachineAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(initialData ? "Data ID di mesin berhasil diperbarui!" : "ID berhasil ditautkan ke mesin!")
      if (!initialData) form.reset({ staffId, machineId: "", machineUserId: "" })
      if (onSuccess) onSuccess()
    }
  }

  async function onDelete(id: string) {
    setIsDeleting(true)
    const result = await deleteStaffMachineAction(id, staffId)
    setIsDeleting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Tautan ID mesin berhasil dihapus!")
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
