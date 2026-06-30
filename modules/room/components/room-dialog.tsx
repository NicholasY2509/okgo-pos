"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RoomForm } from "./room-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { RoomWithBranch } from "../types/room-types"
import { Branch } from "@/modules/branch/types/branch-types"

interface RoomDialogProps {
  initialData?: RoomWithBranch
  branches: Pick<Branch, "id" | "name">[]
  trigger?: React.ReactNode
}

export function RoomDialog({ initialData, branches, trigger }: RoomDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Ruang
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Ruang" : "Tambah Ruang"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Perbarui detail ruangan." : "Tambahkan ruangan baru ke cabang yang dipilih."}
          </DialogDescription>
        </DialogHeader>
        <RoomForm
          initialData={initialData}
          branches={branches}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
