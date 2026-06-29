import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createCategorySchema, type CreateCategoryInput } from "../schemas/category-schema"
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "../actions/category-action"

interface UseCategoryProps {
  initialData?: any;
}

export function useCategory({ initialData }: UseCategoryProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!initialData
  
  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  })

  async function onSubmit(data: CreateCategoryInput) {
    let result
    if (isEditing) {
      result = await updateCategoryAction({ ...data, id: initialData.id })
    } else {
      result = await createCategoryAction(data)
    }

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Kategori berhasil ${isEditing ? "diperbarui" : "dibuat"}`)
      setOpen(false)
      if (!isEditing) form.reset()
    }
  }

  async function onDelete() {
    if (confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      const result = await deleteCategoryAction(initialData.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Kategori berhasil dihapus")
        setOpen(false)
      }
    }
  }

  return {
    open,
    setOpen,
    isEditing,
    form,
    onSubmit: form.handleSubmit(onSubmit),
    onDelete,
    isSubmitting: form.formState.isSubmitting,
  }
}
