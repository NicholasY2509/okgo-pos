"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MachineForm } from "./machine-form"

interface MachineDialogProps {
  initialData?: any
  branches: { id: string; name: string }[]
  children?: React.ReactNode
}

export function MachineDialog({ initialData, branches, children }: MachineDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Tambah Mesin</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Mesin Absensi" : "Tambah Mesin Absensi Baru"}</DialogTitle>
        </DialogHeader>
        <MachineForm 
          initialData={initialData} 
          branches={branches} 
          onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  )
}
