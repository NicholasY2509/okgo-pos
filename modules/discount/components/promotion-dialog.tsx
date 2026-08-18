"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PromotionForm } from "./promotion-form"

interface PromotionDialogProps {
  initialData?: any
  branches: { id: string, name: string }[]
  products: { id: string, name: string }[]
}

export function PromotionDialog({ initialData, branches, products }: PromotionDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initialData ? (
          <Button variant="outline" size="sm">Edit</Button>
        ) : (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Promo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Promo" : "Tambah Promo Baru"}</DialogTitle>
          <DialogDescription>
            Buat aturan diskon dan promo yang kompleks untuk memikat pelanggan.
          </DialogDescription>
        </DialogHeader>
        <PromotionForm
          initialData={initialData}
          branches={branches}
          products={products}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
