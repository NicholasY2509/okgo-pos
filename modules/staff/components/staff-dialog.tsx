"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StaffForm } from "./staff-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface StaffDialogProps {
  workPositions: { id: string; name: string }[]
  branches: { id: string; name: string }[]
}

export function StaffDialog({ workPositions, branches }: StaffDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Staf
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buat Anggota Staf</DialogTitle>
          <DialogDescription>
            Tambahkan anggota staf baru ke sistem.
          </DialogDescription>
        </DialogHeader>
        <StaffForm 
          workPositions={workPositions}
          branches={branches}
          onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  )
}
