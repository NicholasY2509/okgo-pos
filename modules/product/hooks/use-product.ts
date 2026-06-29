import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "../actions/product-action"
import {
  createProductSchema,
} from "../schemas/product-schema"

interface UseProductFormOptions {
  initialData?: any
  onSuccess?: () => void
}

export function useProductForm({ initialData, onSuccess }: UseProductFormOptions = {}) {
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!initialData

  const form = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      duration: initialData?.duration || 60,
      categoryId: initialData?.categoryId || "",
      isActive: initialData?.isActive ?? true,
      isVip: initialData?.isVip ?? false,
      image: initialData?.image || "",
    },
  })

  async function onSubmit(data: any) {
    setError(null)
    const payload = {
      ...data,
      categoryId: data.categoryId === "none" ? null : data.categoryId
    }

    console.log("Submitting payload:", payload)

    let result
    if (isEditing) {
      result = await updateProductAction({ ...payload, id: initialData.id })
    } else {
      result = await createProductAction(payload)
    }

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`Layanan berhasil ${isEditing ? "diperbarui" : "dibuat"}`)
      if (!isEditing) form.reset()
      onSuccess?.()
    }

    return result
  }

  async function onDelete() {
    if (!isEditing) return
    if (confirm("Apakah Anda yakin ingin menghapus layanan ini?")) {
      const result = await deleteProductAction(initialData.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Layanan berhasil dihapus")
        onSuccess?.()
      }
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    onDelete,
    isSubmitting: form.formState.isSubmitting,
    isEditing,
    error,
  }
}
