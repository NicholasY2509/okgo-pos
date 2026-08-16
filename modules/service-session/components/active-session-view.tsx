"use client"

import { useState } from "react"
import { format, differenceInMinutes } from "date-fns"
import { useSessionTimer } from "../hooks/use-session-timer"
import { Button } from "@/components/ui/button"
import { endServiceSessionAction } from "../actions/service-session-action"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ActiveSessionView({ session, tenantSlug }: { session: any, tenantSlug: string }) {
  const [loading, setLoading] = useState(false)
  const [showEarlyModal, setShowEarlyModal] = useState(false)

  const scheduledStartTime = session.startTime ? new Date(session.startTime) : null
  const scheduledEndTime = session.endTime ? new Date(session.endTime) : null
  const actualStartTime = session.actualStartTime ? new Date(session.actualStartTime) : null

  // Calculate expected duration from schedule
  const expectedDurationMinutes = (scheduledStartTime && scheduledEndTime) 
    ? differenceInMinutes(scheduledEndTime, scheduledStartTime)
    : 0

  const { formattedRunningTime, isEarly, earlyByMinutes } = useSessionTimer(actualStartTime, expectedDurationMinutes)

  // Calculate lateness
  const lateByMinutes = (scheduledStartTime && actualStartTime && actualStartTime > scheduledStartTime)
    ? differenceInMinutes(actualStartTime, scheduledStartTime)
    : 0

  const handleEndAttempt = () => {
    if (isEarly) {
      setShowEarlyModal(true)
    } else {
      executeEnd()
    }
  }

  const executeEnd = async () => {
    setLoading(true)
    setShowEarlyModal(false)
    const result = await endServiceSessionAction(session.id, tenantSlug)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Sesi layanan selesai!")
    }
    setLoading(false)
  }

  const customerName = session.transactionItem?.transaction?.customer?.name || session.booking?.customer?.name || "Customer Umum"
  const serviceName = session.transactionItem?.itemNameSnapshot || session.booking?.items?.[0]?.itemNameSnapshot || "Layanan"

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-8 p-8 bg-card rounded-xl border shadow-lg text-center relative overflow-hidden">
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-xl" />

      <div className="relative z-10 space-y-2">
        <h2 className="text-4xl font-bold">{customerName}</h2>
        <p className="text-xl text-muted-foreground">{serviceName}</p>
        <p className="text-lg font-medium px-4 py-1 bg-muted rounded-full inline-block mt-2">
          Ruangan: {session.roomId}
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-8 w-full max-w-lg mt-8 text-left border-t border-b py-6">
        <div>
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">Waktu Mulai Seharusnya</p>
          <p className="text-2xl font-mono">{scheduledStartTime ? format(scheduledStartTime, "HH:mm") : "-"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">Waktu Mulai Aktual</p>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-mono">{actualStartTime ? format(actualStartTime, "HH:mm") : "-"}</p>
            {lateByMinutes > 0 && (
              <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                Telat {lateByMinutes} mnt
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center mt-4">
        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-2">Durasi Berjalan</p>
        <div className="text-7xl font-mono font-black text-primary tracking-tight">
          {formattedRunningTime}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Target Selesai: <span className="font-mono font-bold text-foreground">
            {actualStartTime && expectedDurationMinutes > 0
              ? format(new Date(actualStartTime.getTime() + expectedDurationMinutes * 60000), "HH:mm")
              : scheduledEndTime ? format(scheduledEndTime, "HH:mm") : "-"}
          </span>
        </p>
      </div>

      <div className="relative z-10 pt-8 w-full max-w-sm">
        <Button 
          size="lg" 
          className="w-full h-16 text-xl rounded-full" 
          variant="destructive"
          onClick={handleEndAttempt}
          disabled={loading}
        >
          {loading ? "Menyimpan..." : "Akhiri Layanan"}
        </Button>
      </div>

      <Dialog open={showEarlyModal} onOpenChange={setShowEarlyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan Lebih Cepat?</DialogTitle>
            <DialogDescription>
              Apakah anda yakin ingin menandai servis ini selesai <strong className="text-foreground">{earlyByMinutes} menit</strong> lebih cepat dari durasi standar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEarlyModal(false)}>Batal</Button>
            <Button variant="destructive" onClick={executeEnd} disabled={loading}>
              Ya, Selesaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
