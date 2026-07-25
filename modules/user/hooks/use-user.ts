import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createUserAction, updateUserAction } from "../actions/user-action"
import { getRolesAction } from "@/modules/role/actions/role-action"
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "../schemas/user-schema"
import { User, Role } from "@/lib/generated/prisma"

interface UseUserProps {
  initialData?: User & { roleId?: string | null } | null;
  onSuccess?: () => void;
}

export function useUserForm({ initialData, onSuccess }: UseUserProps) {
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)
  const isEditing = !!initialData;

  useEffect(() => {
    async function fetchRoles() {
      const result = await getRolesAction()
      if (result.success && result.data) {
        setRoles(result.data as Role[])
      } else {
        toast.error("Gagal memuat daftar role")
      }
      setIsLoadingRoles(false)
    }
    fetchRoles()
  }, [])

  const form = useForm<UpdateUserInput | CreateUserInput>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: initialData ? {
      id: initialData.id,
      name: initialData.name || "",
      email: initialData.email || "",
      password: "",
      roleId: initialData.roleId || "",
    } : {
      name: "",
      email: "",
      password: "",
      roleId: "",
    },
  })

  async function onSubmit(values: UpdateUserInput | CreateUserInput) {
    setError(null)
    
    // Convert empty string or "none" roleId to undefined
    const submitValues = { ...values }
    if (!submitValues.roleId || submitValues.roleId === "none") {
      submitValues.roleId = undefined;
    }

    const result = isEditing 
      ? await updateUserAction(submitValues as UpdateUserInput)
      : await createUserAction(submitValues as CreateUserInput)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`Pengguna berhasil ${isEditing ? 'diperbarui' : 'dibuat'}!`)
      if (!isEditing) {
        form.reset()
      }
      if (onSuccess) {
        onSuccess()
      }
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
    isEditing,
    roles,
    isLoadingRoles,
  }
}
