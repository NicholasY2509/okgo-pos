"use client"

import { format, differenceInMinutes } from "date-fns"

export function HistoryList({ sessions }: { sessions: any[] }) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
        <p>Belum ada riwayat sesi layanan untuk hari ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 h-full overflow-y-auto pr-2">
      {sessions.map((session) => {
        const customerName = session.transactionItem?.transaction?.customer?.name || session.booking?.customer?.name || "Customer Umum"
        const serviceName = session.transactionItem?.itemNameSnapshot || session.booking?.items?.[0]?.itemNameSnapshot || "Layanan"
        
        const startTime = session.actualStartTime ? new Date(session.actualStartTime) : (session.startTime ? new Date(session.startTime) : null)
        const endTime = session.actualEndTime ? new Date(session.actualEndTime) : null

        const duration = (startTime && endTime) ? differenceInMinutes(endTime, startTime) : 0

        return (
          <div key={session.id} className="flex flex-col p-4 border rounded-xl bg-card shadow-sm opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-lg leading-none">{customerName}</p>
                <p className="text-sm text-muted-foreground mt-1">{serviceName}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded-full">
                Selesai
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Waktu</p>
                <p className="font-mono font-medium">
                  {startTime ? format(startTime, "HH:mm") : "-"} - {endTime ? format(endTime, "HH:mm") : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Durasi</p>
                <p className="font-mono font-medium">{duration} mnt</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
