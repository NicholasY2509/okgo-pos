"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CoaForm } from "./coa-form"

interface CoaFormDialogProps {
  branchId: string
  initialData?: any
  trigger?: React.ReactNode
}

export function CoaFormDialog({ branchId, initialData, trigger }: CoaFormDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Akun
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{initialData ? "Ubah Akun" : "Buat Akun Baru"}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <CoaForm branchId={branchId} initialData={initialData} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
