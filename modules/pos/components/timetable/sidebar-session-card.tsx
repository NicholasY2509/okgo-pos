"use client";

import { format } from "date-fns";
import { Clock, DoorClosed, User, Phone, Play, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTimetableStore } from "../../stores/timetable-store";

interface SidebarSessionCardProps {
  session: any;
}

export function SidebarSessionCard({ session }: SidebarSessionCardProps) {
  const { setSelectedSessionForInfo, rooms, handleStart, handleComplete } = useTimetableStore();
  const room = rooms.find((r: any) => r.id === session.roomId);

  const isBooking = !!session.isBooking || !!session.bookingId;
  const now = new Date();

  // Duration
  let durationMinutes = 0;
  if (session.startTime && session.endTime) {
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  }

  // Progress & remaining time for in-progress session
  let remainingMinutes: number | null = null;
  let progressPercent = 0;
  if (session.status === "IN_PROGRESS" && session.startTime && session.endTime) {
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    const current = now.getTime();
    const total = end - start;
    if (total > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round(((current - start) / total) * 100)));
    }
    remainingMinutes = Math.round((end - current) / 60000);
  }

  const isPaid = session.paymentStatus === "COMPLETED";
  const isPendingPayment = session.paymentStatus === "PENDING";

  return (
    <Card
      className="cursor-pointer hover:bg-muted/30 transition-all border border-border group"
      onClick={() => setSelectedSessionForInfo(session)}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header: Service name & Badges */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {session.itemName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground truncate max-w-[130px]">
                {session.customerName || "Pelanggan"}
              </span>
              {session.customerPhone && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/80 shrink-0">
                  <Phone className="w-2.5 h-2.5" />
                  {session.customerPhone}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 h-4 ${
                  isBooking
                    ? "bg-muted text-foreground border-border font-semibold"
                    : "bg-muted/40 text-muted-foreground border-border"
                }`}
              >
                {isBooking ? "Booking" : "Walk-in"}
              </Badge>
              <Badge
                variant={
                  session.status === "COMPLETED"
                    ? "secondary"
                    : session.status === "IN_PROGRESS"
                      ? "default"
                      : "outline"
                }
                className="text-[10px] whitespace-nowrap"
              >
                {session.status === "COMPLETED"
                  ? "Selesai"
                  : session.status === "IN_PROGRESS"
                    ? "Berlangsung"
                    : session.status === "CANCELLED"
                      ? "Dibatalkan"
                      : "Terjadwal"}
              </Badge>
            </div>
            {isPendingPayment && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-3.5 uppercase font-medium">
                Belum Bayar
              </Badge>
            )}
            {isPaid && (
              <span className="text-[9px] text-muted-foreground font-mono">
                Lunas
              </span>
            )}
          </div>
        </div>

        {/* Room & Staff */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 truncate">
            <DoorClosed className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate font-medium text-foreground">{room?.name || "Ruangan -"}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{session.staff ? `${session.staff.firstName}` : "Tanpa Terapis"}</span>
          </div>
        </div>

        {/* Time, duration & booking reference */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-mono text-foreground font-medium text-[11px]">
              {session.startTime ? format(new Date(session.startTime), "HH:mm") : "--:--"}
              {session.endTime ? ` - ${format(new Date(session.endTime), "HH:mm")}` : ""}
            </span>
            {durationMinutes > 0 && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                {durationMinutes} mnt
              </span>
            )}
          </div>
          {session.bookingNumber && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1 rounded">
              #{session.bookingNumber.slice(-4).toUpperCase()}
            </span>
          )}
        </div>

        {/* In-Progress Live Bar & Indicator */}
        {session.status === "IN_PROGRESS" && (
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-primary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Sedang berjalan
              </span>
              {remainingMinutes !== null && (
                <span className={`font-medium ${remainingMinutes <= 5 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {remainingMinutes > 0 ? `Sisa ${remainingMinutes} mnt` : "Waktu habis"}
                </span>
              )}
            </div>
            <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {(session.status === "SCHEDULED" || session.status === "IN_PROGRESS") && (
          <div className="pt-1.5 border-t border-border/40 flex items-center justify-end gap-1.5">
            {session.status === "SCHEDULED" && (
              <Button
                size="sm"
                variant="outline"
                className="h-6.5 text-[11px] px-2.5 gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStart(session.id);
                }}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Mulai</span>
              </Button>
            )}
            {session.status === "IN_PROGRESS" && (
              <Button
                size="sm"
                variant="outline"
                className="h-6.5 text-[11px] px-2.5 gap-1 hover:bg-emerald-600 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete(session.id);
                }}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Selesai</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
