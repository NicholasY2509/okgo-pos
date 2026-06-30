"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RoleForm } from "./role-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UpdateRoleInput } from "../schemas/role-schema"

interface RoleDialogProps {
  initialData?: UpdateRoleInput
  trigger?: React.ReactNode
}

export function RoleDialog({ initialData, trigger }: RoleDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Role" : "Buat Role"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Perbarui informasi role ini." : "Tambahkan role baru ke sistem."}
          </DialogDescription>
        </DialogHeader>
        <RoleForm
          initialData={initialData}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
