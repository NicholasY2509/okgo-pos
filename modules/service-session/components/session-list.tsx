"use client"

import { useState } from "react"
import { toast } from "sonner"
import { startServiceSessionAction } from "../actions/service-session-action"
import { Button } from "@/components/ui/button"
import { io } from "socket.io-client"

export function SessionList({ sessions, tenantSlug }: { sessions: any[], tenantSlug: string }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleStart = async (sessionId: string) => {
    setLoadingId(sessionId)
    const result = await startServiceSessionAction(sessionId, tenantSlug)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Sesi layanan dimulai!")

      // Get the session we just started to extract names
      const sessionObj = sessions.find(s => s.id === sessionId);
      const serviceName = sessionObj?.transactionItem?.itemNameSnapshot || sessionObj?.booking?.items?.[0]?.itemNameSnapshot || "Layanan";
      const staffName = sessionObj?.staff ? `${sessionObj.staff.firstName} ${sessionObj.staff.lastName || ""}`.trim() : "Terapis";

      // Notify POS and other clients
      const socket = io(process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined);
      socket.emit("service_status_changed", { sessionId, action: "start", serviceName, staffName });
      setTimeout(() => socket.disconnect(), 1000);
    }
    setLoadingId(null)
  }

  const scheduledSessions = sessions.filter(s => s.status === "SCHEDULED")

  if (scheduledSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
        <p>Tidak ada antrean sesi layanan terjadwal.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 h-full overflow-y-auto pr-2">
      {scheduledSessions.map((session) => {
        const customerName = session.transactionItem?.transaction?.customer?.name || session.booking?.customer?.name || "Customer Umum"

        return (
          <div key={session.id} className="flex flex-col p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-lg leading-none">{customerName}</p>
                <p className="text-sm text-muted-foreground mt-1">Ruangan: {session.roomName || session.roomId}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                Menunggu
              </span>
            </div>

            <Button
              className="w-full"
              onClick={() => handleStart(session.id)}
              disabled={loadingId === session.id}
            >
              {loadingId === session.id ? "Memproses..." : "Mulai Layanan"}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
