"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { WorkingHourForm } from "./working-hour-form"
import type { WorkingHourInput } from "../schemas/working-hour"

interface WorkingHourDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialData?: WorkingHourInput & { id: string }
}

export function WorkingHourDialog({ open, onOpenChange, initialData }: WorkingHourDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = open !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen
  const handleOpenChange = isControlled ? onOpenChange : setInternalOpen

  const isEditing = !!initialData?.id

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Shift Template
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Shift Template" : "Create Shift Template"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this working hour template."
              : "Define a new working hour schedule for your staff."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <WorkingHourForm
            initialData={initialData}
            onSuccess={() => handleOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
