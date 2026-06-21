"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserForm } from "./user-form"
import { Button } from "@/components/ui/button"
import { Edit2, Plus } from "lucide-react"
import { User } from "@/lib/generated/prisma"

interface UserDialogProps {
  initialData?: User | null;
}

export function UserDialog({ initialData }: UserDialogProps) {
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
            Tambah Pengguna
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Pengguna" : "Buat Pengguna Baru"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Buat perubahan pada detail pengguna di bawah ini." 
              : "Tambahkan pengguna baru ke sistem."}
          </DialogDescription>
        </DialogHeader>
        <UserForm initialData={initialData} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
