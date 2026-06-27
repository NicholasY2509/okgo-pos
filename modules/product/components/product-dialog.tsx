"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"
import { Controller } from "react-hook-form"
import { NumericFormat } from "react-number-format"
import { FilePicker } from "@/components/file-picker"

import { useProductForm } from "../hooks/use-product"

interface ProductDialogProps {
  initialData?: any
  categories: any[]
  children?: React.ReactNode
}

export function ProductDialog({ initialData, categories, children }: ProductDialogProps) {
  const [open, setOpen] = useState(false)

  const { form, onSubmit, onDelete, isSubmitting, isEditing } = useProductForm({
    initialData,
    onSuccess: () => setOpen(false),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Layanan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Layanan" : "Tambah Layanan Baru"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Perbarui detail layanan." : "Buat layanan/produk baru."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" {...form.register("name")} placeholder="cth. Pijat Swedia" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Controller
                control={form.control}
                name="price"
                render={({ field }) => (
                  <NumericFormat
                    id="price"
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="Rp "
                    onValueChange={(values) => {
                      field.onChange(values.floatValue || 0)
                    }}
                    value={field.value as number | undefined}
                  />
                )}
              />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="duration">Durasi (menit)</Label>
              <Input id="duration" type="number" {...form.register("duration")} />
              {form.formState.errors.duration && (
                <p className="text-sm text-destructive">{form.formState.errors.duration.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="categoryId">Kategori</Label>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tanpa Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa Kategori</SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2 col-span-2 flex items-center pb-1">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span className="text-sm font-medium leading-none">Aktif</span>
                  </label>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Gambar Layanan</Label>
            <Controller
              control={form.control}
              name="image"
              render={({ field }) => (
                <FilePicker
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
