"use client"

import React, { useTransition, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AttendanceStatusPicker } from "@/modules/attendance-status/components/attendance-status-picker"
import { updateAttendanceStatusAction } from "../actions/attendance-action"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { FilePicker } from "@/components/file-picker"
import { Button } from "@/components/ui/button"

interface AttendanceDetailDialogProps {
  attendance: any | null
  statuses?: any[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttendanceDetailDialog({
  attendance,
  statuses,
  open,
  onOpenChange,
}: AttendanceDetailDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedStatusId, setSelectedStatusId] = useState<string>("")
  const [attachmentUrl, setAttachmentUrl] = useState<string>("")

  useEffect(() => {
    if (attendance && open) {
      setSelectedStatusId(attendance.status?.id || "")
      setAttachmentUrl(attendance.attachmentUrl || "")
    }
  }, [attendance, open])

  if (!attendance) return null

  const handleSave = () => {
    if (!selectedStatusId) {
      toast.error("Silakan pilih status terlebih dahulu.")
      return
    }
    startTransition(async () => {
      const res = await updateAttendanceStatusAction(attendance.id, selectedStatusId, attachmentUrl)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Status absensi berhasil disimpan.")
        router.refresh()
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detail Absensi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-muted-foreground">Staf</div>
              <div>{attendance.staff?.firstName} {attendance.staff?.lastName}</div>
            </div>
            <div>
              <div className="font-semibold text-muted-foreground">Tanggal</div>
              <div>{new Date(attendance.attendanceDate).toLocaleDateString("id-ID")}</div>
            </div>
            <div>
              <div className="font-semibold text-muted-foreground">Jam Masuk</div>
              <div>
                {attendance.clockIn ? new Date(attendance.clockIn).toLocaleTimeString("id-ID") : "-"}
                {attendance.clockInMachine && (
                  <div className="text-xs text-muted-foreground">{attendance.clockInMachine.name}</div>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold text-muted-foreground">Jam Pulang</div>
              <div>
                {attendance.clockOut ? new Date(attendance.clockOut).toLocaleTimeString("id-ID") : "-"}
                {attendance.clockOutMachine && (
                  <div className="text-xs text-muted-foreground">{attendance.clockOutMachine.name}</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="font-semibold">Ubah Status</div>
            <AttendanceStatusPicker
              value={selectedStatusId}
              onChange={setSelectedStatusId}
              statusList={statuses}
              className="w-full"
            />
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="font-semibold">Lampiran (Surat Sakit / Izin)</div>
            <FilePicker
              value={attachmentUrl}
              onChange={(url) => setAttachmentUrl(url)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
