"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { removeBranchStaffAction } from "../actions/branch-action"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface RemoveStaffButtonProps {
  branchStaffId: string
  branchId: string
  staffName: string
}

export function RemoveStaffButton({ branchStaffId, branchId, staffName }: RemoveStaffButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleRemove() {
    setIsDeleting(true)
    const result = await removeBranchStaffAction(branchStaffId, branchId)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Penugasan staf berhasil dihapus.")
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Penugasan Staf</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus {staffName} dari cabang ini?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <Button variant="destructive" onClick={handleRemove} disabled={isDeleting}>
            {isDeleting ? "Menghapus..." : "Hapus"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
