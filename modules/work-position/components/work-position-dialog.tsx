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
          Tambah Posisi Kerja
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Posisi Kerja</DialogTitle>
          <DialogDescription>
            Tambahkan posisi kerja/peran baru untuk staf Anda.
          </DialogDescription>
        </DialogHeader>
        <WorkPositionForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
