"use client"

import { useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { User, Clock } from "lucide-react"
import { ReviewModal } from "./review-modal"

export function ReviewList({ sessions, tenantSlug }: { sessions: any[]; tenantSlug: string }) {
  const [selectedSession, setSelectedSession] = useState<any | null>(null)

  return (
    <>
      <div className="flex flex-col gap-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setSelectedSession(session)}
            className="group bg-background rounded-[2rem] p-8 shadow-sm border border-border/50 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.99] flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-xs text-primary/70 font-medium uppercase tracking-[0.2em] mb-2">Pelanggan</span>
              <h3 className="font-display font-light text-3xl text-foreground mb-4 group-hover:text-primary transition-colors">
                {session.transactionItem?.transaction?.customer?.name || "Pelanggan Umum"}
              </h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <span className="text-sm font-light text-primary bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full">
                  {session.transactionItem?.itemNameSnapshot || "Layanan"}
                </span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-light">
                  <Clock size={16} className="stroke-1" />
                  <span>
                    {session.actualEndTime ? format(new Date(session.actualEndTime), "HH:mm", { locale: id }) : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-6 sm:text-right">
              <div className="text-center sm:text-right">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] mb-1">Terapis</p>
                <p className="font-display font-light text-foreground text-xl">{session.staff?.firstName}</p>
              </div>
              {session.staff?.imageUrl ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border border-border/50 group-hover:scale-105 transition-transform duration-500">
                  <img
                    src={session.staff.imageUrl}
                    alt={session.staff.firstName}
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground group-hover:scale-105 transition-transform duration-500">
                  <User size={32} className="stroke-1" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ReviewModal
        session={selectedSession}
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        tenantSlug={tenantSlug}
      />
    </>
  )
}
