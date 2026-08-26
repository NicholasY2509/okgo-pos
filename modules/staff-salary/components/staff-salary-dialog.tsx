"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { StaffSalaryForm } from "./staff-salary-form"
import { StaffSalaryInput } from "../schemas/staff-salary-schema"

interface StaffSalaryDialogProps {
  staffId: string
  staffName: string
  initialData?: StaffSalaryInput & { id: string }
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function StaffSalaryDialog({ staffId, staffName, initialData, onSuccess, trigger }: StaffSalaryDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    setOpen(false)
    if (onSuccess) {
      onSuccess()
    } else {
      router.refresh()
    }
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {initialData ? (
              <><Edit className="mr-2 h-4 w-4" /> Edit Gaji</>
            ) : (
              <><Plus className="mr-2 h-4 w-4" /> Atur Gaji</>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Gaji Pokok" : "Atur Gaji Pokok"}</DialogTitle>
          <DialogDescription>
            Konfigurasi gaji untuk staf <strong>{staffName}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <StaffSalaryForm
            staffId={staffId}
            initialData={initialData}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
