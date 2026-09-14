"use client"

import { useState } from "react"
import { format, differenceInMinutes } from "date-fns"
import { useSessionTimer } from "../hooks/use-session-timer"
import { Button } from "@/components/ui/button"
import { endServiceSessionAction } from "../actions/service-session-action"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { io } from "socket.io-client"
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

      // Extract names
      const serviceName = session.transactionItem?.itemNameSnapshot || session.booking?.items?.[0]?.itemNameSnapshot || "Layanan";
      const staffName = session.staff ? `${session.staff.firstName} ${session.staff.lastName || ""}`.trim() : "Terapis";

      // Notify POS and other clients
      const socket = io(process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined);
      socket.emit("service_status_changed", { sessionId: session.id, action: "end", serviceName, staffName });
      setTimeout(() => socket.disconnect(), 1000);
    }
    setLoading(false)
  }

  const customerName = session.transactionItem?.transaction?.customer?.name || session.booking?.customer?.name || "Customer Umum"
  const serviceName = session.transactionItem?.itemNameSnapshot || session.booking?.items?.[0]?.itemNameSnapshot || "Layanan"

  return (
    <div className="flex flex-col h-full w-full p-8 md:p-12 lg:p-20 relative bg-background justify-center overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 w-full max-w-7xl mx-auto items-center">

        {/* Left Side: Info */}
        <div className="flex flex-col items-start text-left space-y-8">
          <div className="space-y-4">
            <h2 className="text-6xl md:text-7xl lg:text-[5rem] font-light tracking-tight leading-tight">{customerName}</h2>
            <p className="text-3xl lg:text-4xl text-muted-foreground font-light">{serviceName}</p>
          </div>
          <span className="text-xl font-light">
            Ruangan: {session.roomName || session.roomId}
          </span>

          <div className="grid grid-cols-2 gap-12 mt-8 pt-10 border-t w-full max-w-md">
            <div className="flex flex-col items-start">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mb-2">Seharusnya</p>
              <p className="text-4xl font-light">{scheduledStartTime ? format(scheduledStartTime, "HH:mm") : "-"}</p>
            </div>
            <div className="flex flex-col items-start">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mb-2">Aktual</p>
              <div className="flex flex-col items-start gap-2">
                <p className="text-4xl font-light">{actualStartTime ? format(actualStartTime, "HH:mm") : "-"}</p>
                {lateByMinutes > 0 && (
                  <span className="text-xs font-bold text-destructive uppercase tracking-widest bg-destructive/10 px-2.5 py-1 rounded-full mt-1">
                    Telat {lateByMinutes} mnt
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Timer & Action */}
        <div className="flex flex-col items-center lg:items-end text-center lg:text-right space-y-12">
          <div className="flex flex-col items-center lg:items-end">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mb-6">Durasi Berjalan</p>
            <div className="flex text-[5rem] md:text-[7rem] lg:text-[8rem] font-light tabular-nums tracking-tighter text-foreground leading-none overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                {formattedRunningTime.split("").map((char, index) => (
                  <motion.span
                    key={`${index}-${char}`}
                    initial={{ y: 20, opacity: 0, filter: "blur(2px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -20, opacity: 0, filter: "blur(2px)" }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
            <div className="text-lg text-muted-foreground mt-8 flex items-center gap-3">
              <span>Target Selesai:</span>
              <span className="font-medium text-foreground bg-muted px-3 py-1.5 rounded-lg">
                {actualStartTime && expectedDurationMinutes > 0
                  ? format(new Date(actualStartTime.getTime() + expectedDurationMinutes * 60000), "HH:mm")
                  : scheduledEndTime ? format(scheduledEndTime, "HH:mm") : "-"}
              </span>
            </div>
          </div>

          <div className="w-full max-w-sm pt-4">
            <Button
              size="lg"
              className="w-full h-16 text-xl rounded-full font-medium transition-all"
              onClick={handleEndAttempt}
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Akhiri Layanan"}
            </Button>
          </div>
        </div>
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
