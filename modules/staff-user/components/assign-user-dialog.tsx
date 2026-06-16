"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AssignUserForm } from "./assign-user-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface AssignUserDialogProps {
  staffId: string
  users: { id: string; name: string | null; email: string | null }[]
}

export function AssignUserDialog({ staffId, users }: AssignUserDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Assign User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign User Account</DialogTitle>
          <DialogDescription>
            Select an application user to link to this staff member. This will allow the user to log in as this staff.
          </DialogDescription>
        </DialogHeader>
        <AssignUserForm staffId={staffId} users={users} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
