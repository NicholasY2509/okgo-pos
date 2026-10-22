"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { useSyncAttendance } from "../hooks/use-sync-attendance"

interface PurgeUnrecognizedDialogProps {
  branchId?: string
}

export function PurgeUnrecognizedDialog({ branchId }: PurgeUnrecognizedDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { purgeUnrecognized, isPurging } = useSyncAttendance()

  async function handleConfirm() {
    await purgeUnrecognized(branchId)
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          Bersihkan Data Tidak Dikenal
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bersihkan Log Scan Tidak Dikenal?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini akan menghapus semua riwayat raw log yang tidak memiliki identitas karyawan
            atau tidak dikenali oleh mesin absensi (misal: orang lewat, pengunjung yang terdeteksi kamera).
            Seluruh data absensi staf resmi yang valid akan tetap aman.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPurging}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPurging}
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
          >
            {isPurging ? "Membersihkan..." : "Hapus Data Tidak Dikenal"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
