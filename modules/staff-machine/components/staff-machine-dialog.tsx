"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StaffMachineForm } from "./staff-machine-form"

interface StaffMachineDialogProps {
  staffId: string
  initialData?: any
  machines: any[]
  children?: React.ReactNode
}

export function StaffMachineDialog({ staffId, initialData, machines, children }: StaffMachineDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Tautkan Mesin</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Tautan Mesin" : "Tautkan ID Mesin Baru"}</DialogTitle>
        </DialogHeader>
        <StaffMachineForm 
          staffId={staffId}
          initialData={initialData} 
          machines={machines} 
          onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  )
}
