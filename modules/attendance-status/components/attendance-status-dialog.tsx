"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AttendanceStatusForm } from "./attendance-status-form"

interface AttendanceStatusDialogProps {
  initialData?: any
  children?: React.ReactNode
}

export function AttendanceStatusDialog({ initialData, children }: AttendanceStatusDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Tambah Status</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Status Absensi" : "Tambah Status Absensi Baru"}</DialogTitle>
        </DialogHeader>
        <AttendanceStatusForm 
          initialData={initialData} 
          onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  )
}
