"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BranchForm } from "./branch-form"
import { Button } from "@/components/ui/button"
import { Edit2, Plus } from "lucide-react"
import { Branch } from "@/lib/generated/prisma"

interface BranchDialogProps {
  initialData?: Branch | null;
}

export function BranchDialog({ initialData }: BranchDialogProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!initialData;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Cabang
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Cabang" : "Buat Cabang Baru"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Buat perubahan pada detail cabang di bawah ini."
              : "Tambahkan lokasi cabang baru ke sistem."}
          </DialogDescription>
        </DialogHeader>
        <BranchForm initialData={initialData} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
