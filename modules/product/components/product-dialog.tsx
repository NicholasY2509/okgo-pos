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
            Add Service
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Service" : "Add New Service"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update service details." : "Create a new service/product."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g. Swedish Massage" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="price">Price (IDR)</Label>
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
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input id="duration" type="number" {...form.register("duration")} />
              {form.formState.errors.duration && (
                <p className="text-sm text-destructive">{form.formState.errors.duration.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="categoryId">Category</Label>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="No Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1 flex items-center pb-1">
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
                    <span className="text-sm font-medium leading-none">Active</span>
                  </label>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Service Image</Label>
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
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} placeholder="Optional description" />
          </div>

          <DialogFooter className="flex items-center sm:justify-between pt-4 border-t">
            {isEditing && (
              <Button type="button" variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
