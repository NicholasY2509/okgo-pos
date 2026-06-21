"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

import { createCategorySchema, type CreateCategoryInput } from "../schemas/category-schema"
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "../actions/category-action"

interface CategoryDialogProps {
  initialData?: any
  children?: React.ReactNode
}

export function CategoryDialog({ initialData, children }: CategoryDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kategori
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Perbarui detail kategori." : "Buat kategori baru untuk mengelompokkan produk/layanan Anda."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" {...form.register("name")} placeholder="cth. Pijat" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...form.register("description")} placeholder="Deskripsi opsional" />
          </div>
          
          <DialogFooter className="flex items-center sm:justify-between pt-4 border-t">
            {isEditing && (
              <Button type="button" variant="destructive" onClick={onDelete}>
                Hapus
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
