"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WorkPositionForm } from "./work-position-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function WorkPositionDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Work Position
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Work Position</DialogTitle>
          <DialogDescription>
            Add a new work position/role for your staff.
          </DialogDescription>
        </DialogHeader>
        <WorkPositionForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
