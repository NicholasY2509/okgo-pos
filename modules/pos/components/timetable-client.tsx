"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { getSessionsByDateAction, completeSessionAction, updateSessionTimeAction } from "../actions/timetable-action";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRef } from "react";
import { ExistingTransactionPaymentModal } from "./existing-payment-modal";

function calculateSessionLanes(sessions: any[]) {
  const sorted = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const lanes: any[][] = [];

  const positionedSessions = sorted.map(session => {
    if (!session.startTime) return { ...session, lane: 0 };
    const start = new Date(session.startTime).getTime();
    const end = session.endTime ? new Date(session.endTime).getTime() : start + 60 * 60 * 1000;

    let assignedLane = 0;
    while (true) {
      if (!lanes[assignedLane]) {
        lanes[assignedLane] = [];
        break;
      }

      const overlap = lanes[assignedLane].some(s => {
        const sStart = new Date(s.startTime).getTime();
        const sEnd = s.endTime ? new Date(s.endTime).getTime() : sStart + 60 * 60 * 1000;
        return (start < sEnd && end > sStart);
      });

      if (!overlap) break;
      assignedLane++;
    }

    lanes[assignedLane].push(session);
    return { ...session, lane: assignedLane };
  });

  return { positionedSessions, maxLane: lanes.length > 0 ? lanes.length - 1 : 0 };
}

const BUSINESS_HOURS_START = 8;
const BUSINESS_HOURS_END = 22;
const TOTAL_HOURS = BUSINESS_HOURS_END - BUSINESS_HOURS_START;

interface TimetableClientProps {
  branchId: string;
  rooms: any[];
  paymentMethods: any[];
}

export function TimetableClient({ branchId, rooms, paymentMethods }: TimetableClientProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async (targetDate: Date) => {
    setLoading(true);
    const res = await getSessionsByDateAction(branchId, targetDate.toISOString());
    if (res.success) {
      setSessions(res.data);
    } else {
      toast.error(res.error || "Gagal memuat jadwal");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions(date);
    const interval = setInterval(() => fetchSessions(date), 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [branchId, date]);

  const handleComplete = async (sessionId: string) => {
    const res = await completeSessionAction(sessionId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Sesi selesai");
      fetchSessions(date);
    }
  };

  const handleUpdateSessionTime = async (sessionId: string, newStart: Date, newEnd: Date) => {
    const previousSessions = [...sessions];
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, startTime: newStart.toISOString(), endTime: newEnd.toISOString() } : s));

    const res = await updateSessionTimeAction(sessionId, newStart, newEnd);
    if (res.error) {
      toast.error(res.error);
      setSessions(previousSessions);
    } else {
      toast.success("Waktu sesi diperbarui");
    }
  };

  const hoursArray = Array.from({ length: TOTAL_HOURS }, (_, i) => i + BUSINESS_HOURS_START);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/20">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <a href={`/pos`}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Kembali ke POS
            </a>
          </Button>
          <h2 className="text-xl font-bold tracking-tight">Jadwal Ruangan</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate(subDays(date, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <DatePicker
            date={date}
            setDate={(d) => d && setDate(d)}
            className="w-[240px]"
          />
          <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="default" onClick={() => setDate(new Date())} className="ml-2">
            Hari Ini
          </Button>
        </div>
      </div>

      {/* Gantt Chart Area */}
      <div className="flex-1 overflow-auto relative flex flex-col">
        {/* X-Axis Header (Time) */}
        <div className="flex sticky top-0 z-30 bg-muted/40 border-b border-border min-w-max">
          <div className="w-48 shrink-0 border-r border-border p-3 font-semibold text-sm flex items-center justify-center bg-background sticky left-0 z-40 shadow-[1px_0_0_0_hsl(var(--border))]">
            Ruangan
          </div>
          <div className="flex-1 relative flex">
            {hoursArray.map(hour => (
              <div key={hour} className="flex-1 min-w-[120px] border-r border-border p-2 text-xs font-medium text-muted-foreground text-center">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Y-Axis Body (Rooms & Sessions) */}
        <div className="flex-1 flex flex-col min-w-max relative pb-4">
          {rooms.map(room => {
            const roomSessions = sessions.filter(s => s.roomId === room.id && s.startTime);
            const { positionedSessions, maxLane } = calculateSessionLanes(roomSessions);
            const rowHeight = Math.max(96, (maxLane + 1) * 80 + 16); // 96px min (h-24), 80px per lane + 16px padding

            return (
              <div key={room.id} className="flex border-b border-border hover:bg-muted/10 group">
                <div className="w-48 shrink-0 border-r border-border p-4 font-medium flex items-center bg-background sticky left-0 z-20 group-hover:bg-muted/10 shadow-[1px_0_0_0_hsl(var(--border))] isolate">
                  <div className="flex flex-col">
                    <span>{room.name}</span>
                    <span className="text-xs text-muted-foreground">Kap: {room.capacity || '-'}</span>
                  </div>
                </div>

                <div className="flex-1 relative z-0 flex isolate">
                  {/* Grid Lines */}
                  {hoursArray.map(hour => (
                    <div key={hour} className="flex-1 min-w-[120px] border-r border-border" style={{ height: `${rowHeight}px` }} />
                  ))}

                  {/* Sessions */}
                  {positionedSessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      lane={session.lane}
                      onComplete={() => handleComplete(session.id)}
                      onUpdateTime={(start, end) => handleUpdateSessionTime(session.id, start, end)}
                      paymentMethods={paymentMethods}
                      onPaymentSuccess={() => fetchSessions(date)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {rooms.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">Belum ada ruang terdaftar.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session, lane = 0, onComplete, onUpdateTime, paymentMethods, onPaymentSuccess }: { session: any, lane?: number, onComplete: () => void, onUpdateTime?: (start: Date, end: Date) => void, paymentMethods: any[], onPaymentSuccess: () => void }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentTransaction, setSelectedPaymentTransaction] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  const cardRef = useRef<HTMLDivElement>(null);

  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const [localStart, setLocalStart] = useState<Date>(new Date(session.startTime));
  const [localEnd, setLocalEnd] = useState<Date>(session.endTime ? new Date(session.endTime) : new Date(new Date(session.startTime).getTime() + 60 * 60 * 1000));

  useEffect(() => {
    if (!isDragging && !isResizingLeft && !isResizingRight) {
      setLocalStart(new Date(session.startTime));
      setLocalEnd(session.endTime ? new Date(session.endTime) : new Date(new Date(session.startTime).getTime() + 60 * 60 * 1000));
    }
  }, [session.startTime, session.endTime, isDragging, isResizingLeft, isResizingRight]);

  useEffect(() => {
    if (session.status === "COMPLETED") return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [session.status]);

  if (!session.startTime) return null;

  const startHour = localStart.getHours() + localStart.getMinutes() / 60;
  const endHour = localEnd.getHours() + localEnd.getMinutes() / 60;

  // Clamp to business hours for display
  const clampedStart = Math.max(BUSINESS_HOURS_START, Math.min(startHour, BUSINESS_HOURS_END));
  const clampedEnd = Math.max(BUSINESS_HOURS_START, Math.min(endHour, BUSINESS_HOURS_END));

  if (clampedStart >= BUSINESS_HOURS_END || clampedEnd <= BUSINESS_HOURS_START) {
    return null; // completely outside business hours
  }

  const left = ((clampedStart - BUSINESS_HOURS_START) / TOTAL_HOURS) * 100;
  const width = ((clampedEnd - clampedStart) / TOTAL_HOURS) * 100;

  // Calculate timer (Elapsed time instead of remaining)
  let timerText = "";
  let timerColor = "text-muted-foreground";

  if (session.status === "IN_PROGRESS") {
    if (now < localStart) {
      const diffStr = getDiffString(localStart, now);
      timerText = `Belum Mulai ${diffStr}`;
    } else {
      const diffStr = getDiffString(localStart, now);
      timerText = `Berjalan ${diffStr}`;
      timerColor = now > localEnd ? "text-red-500 font-bold" : "text-primary font-medium";
    }
  } else if (session.status === "SCHEDULED") {
    const diffStr = getDiffString(localStart, now);
    timerText = `Belum Mulai ${diffStr}`;
  } else if (session.status === "COMPLETED") {
    timerText = "Selesai";
  }

  const calculateTimeDelta = (clientX: number, startX: number) => {
    if (!cardRef.current?.parentElement) return 0;
    const parentWidth = cardRef.current.parentElement.offsetWidth;
    const deltaX = clientX - startX;
    const msPerPixel = (TOTAL_HOURS * 60 * 60 * 1000) / parentWidth;
    return deltaX * msPerPixel;
  };

  const snapTo15Mins = (date: Date) => {
    const ms = date.getTime();
    const snapMs = 15 * 60 * 1000;
    return new Date(Math.round(ms / snapMs) * snapMs);
  };

  const handlePointerDown = (e: React.PointerEvent, mode: 'drag' | 'resizeLeft' | 'resizeRight') => {
    // Only allow left click, and prevent dragging completed sessions
    if (e.button !== 0 || session.status === "COMPLETED") return;
    e.stopPropagation();

    // Prevent default to avoid text selection while dragging
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const initialStart = localStart;
    const initialEnd = localEnd;

    if (mode === 'drag') setIsDragging(true);
    if (mode === 'resizeLeft') setIsResizingLeft(true);
    if (mode === 'resizeRight') setIsResizingRight(true);

    const onMove = (moveEvent: PointerEvent) => {
      const rawDeltaMs = calculateTimeDelta(moveEvent.clientX, startX);
      if (mode === 'drag') {
        const durationMs = initialEnd.getTime() - initialStart.getTime();
        const snappedStart = snapTo15Mins(new Date(initialStart.getTime() + rawDeltaMs));
        setLocalStart(snappedStart);
        setLocalEnd(new Date(snappedStart.getTime() + durationMs));
      } else if (mode === 'resizeLeft') {
        const snappedStart = snapTo15Mins(new Date(initialStart.getTime() + rawDeltaMs));
        if (snappedStart < initialEnd) setLocalStart(snappedStart);
      } else if (mode === 'resizeRight') {
        const snappedEnd = snapTo15Mins(new Date(initialEnd.getTime() + rawDeltaMs));
        if (snappedEnd > initialStart) setLocalEnd(snappedEnd);
      }
    };

    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      setIsDragging(false);
      setIsResizingLeft(false);
      setIsResizingRight(false);

      const deltaX = Math.abs(upEvent.clientX - startX);
      const isClick = deltaX < 5;

      if (isClick && mode === 'drag') {
        setInfoOpen(true);
      } else if (!isClick && onUpdateTime) {
        const rawDeltaMs = calculateTimeDelta(upEvent.clientX, startX);
        if (mode === 'drag') {
          const durationMs = initialEnd.getTime() - initialStart.getTime();
          const snappedStart = snapTo15Mins(new Date(initialStart.getTime() + rawDeltaMs));
          onUpdateTime(snappedStart, new Date(snappedStart.getTime() + durationMs));
        } else if (mode === 'resizeLeft') {
          const snappedStart = snapTo15Mins(new Date(initialStart.getTime() + rawDeltaMs));
          if (snappedStart < initialEnd) onUpdateTime(snappedStart, initialEnd);
        } else if (mode === 'resizeRight') {
          const snappedEnd = snapTo15Mins(new Date(initialEnd.getTime() + rawDeltaMs));
          if (snappedEnd > initialStart) onUpdateTime(initialStart, snappedEnd);
        }
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <>
      <div
        ref={cardRef}
        onPointerDown={(e) => handlePointerDown(e, 'drag')}
        onClick={() => {
          if (session.status === "COMPLETED") setInfoOpen(true);
        }}
        className={cn(
          "absolute rounded-lg p-2 flex flex-col gap-1 overflow-hidden shadow-sm border group/card cursor-pointer",
          session.status === "IN_PROGRESS" ? "bg-primary/10 border-primary/30" :
            session.status === "COMPLETED" ? "bg-muted border-border opacity-70" :
              "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
          (isDragging || isResizingLeft || isResizingRight) ? "z-50 shadow-md opacity-90 transition-none" : "transition-all",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          left: `${left}%`,
          width: `${width}%`,
          top: `${lane * 80 + 8}px`,
          height: `72px`,
          minWidth: '50px',
          zIndex: (isDragging || isResizingLeft || isResizingRight) ? 50 : (session.status === "IN_PROGRESS" ? 10 : 1)
        }}
      >
        {/* Left Resize Handle */}
        {session.status !== "COMPLETED" && (
          <div
            className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-black/10 dark:hover:bg-white/10 z-10"
            onPointerDown={(e) => handlePointerDown(e, 'resizeLeft')}
          />
        )}

        {/* Right Resize Handle */}
        {session.status !== "COMPLETED" && (
          <div
            className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-black/10 dark:hover:bg-white/10 z-10"
            onPointerDown={(e) => handlePointerDown(e, 'resizeRight')}
          />
        )}

        <div className="flex justify-between items-start gap-2 select-none pointer-events-none">
          <span className="font-semibold text-xs truncate" title={session.transactionItem.itemNameSnapshot}>
            {session.transactionItem.itemNameSnapshot}
          </span>
          {session.status === "IN_PROGRESS" && (
            <Button
              size="icon"
              variant="ghost"
              className="w-6 h-6 shrink-0 text-primary hover:text-primary hover:bg-primary/20 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-auto z-20"
              onClick={(e) => {
                e.stopPropagation();
                if (session.transactionItem?.transaction?.status === "PENDING") {
                  toast.error("Tidak dapat menyelesaikan sesi. Pembayaran belum lunas.");
                  return;
                }
                onComplete();
              }}
              title="Selesaikan Sesi"
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5 mt-auto select-none pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="truncate max-w-[50%] font-medium" title={session.customer?.name || "Walk-in"}>
              {session.customer?.name || "Walk-in"}
            </span>
            <span className={cn("flex items-center gap-1 font-medium whitespace-nowrap", timerColor)}>
              <Clock className="w-3 h-3" />
              {timerText}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="truncate max-w-[60%]" title={session.staff ? `${session.staff.firstName} ${session.staff.lastName}` : "Terapis"}>
              Terapis: {session.staff ? session.staff.firstName : "-"}
            </span>
            {session.transactionItem?.transaction?.status === "PENDING" && (
              <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4 uppercase">
                Belum Lunas
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informasi Sesi</DialogTitle>
            <DialogDescription>
              Detail sesi untuk {session.transactionItem.itemNameSnapshot}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4 border-b pb-4">
              <div className="text-sm text-muted-foreground">Pelanggan</div>
              <div className="col-span-2 font-medium">{session.customer?.name || "Walk-in"}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-4">
              <div className="text-sm text-muted-foreground">Layanan</div>
              <div className="col-span-2 font-medium">{session.transactionItem.itemNameSnapshot}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-4">
              <div className="text-sm text-muted-foreground">Terapis</div>
              <div className="col-span-2 font-medium">{session.staff ? `${session.staff.firstName} ${session.staff.lastName}` : '-'}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-4">
              <div className="text-sm text-muted-foreground">Waktu Mulai</div>
              <div className="col-span-2 font-medium">{new Date(session.startTime).toLocaleString('id-ID')}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-4">
              <div className="text-sm text-muted-foreground">
                {session.status === "COMPLETED" ? "Waktu Selesai" : "Estimasi Waktu Selesai"}
              </div>
              <div className="col-span-2 font-medium">{session.endTime ? new Date(session.endTime).toLocaleString('id-ID') : '-'}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="col-span-2 font-medium">
                <Badge variant={session.status === "COMPLETED" ? "secondary" : session.status === "IN_PROGRESS" ? "default" : "outline"}>
                  {session.status === "COMPLETED" ? "Selesai" : session.status === "IN_PROGRESS" ? "Berlangsung" : "Terjadwal"}
                </Badge>
              </div>
            </div>
            {session.transactionItem?.transaction?.status === "PENDING" && (
              <div className="pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedPaymentTransaction(session.transactionItem.transaction);
                    setIsPaymentModalOpen(true);
                    setInfoOpen(false);
                  }}
                >
                  Bayar Sekarang
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isPaymentModalOpen && selectedPaymentTransaction && (
        <ExistingTransactionPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPaymentTransaction(null);
          }}
          transaction={selectedPaymentTransaction}
          paymentMethods={paymentMethods}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setSelectedPaymentTransaction(null);
            onPaymentSuccess();
          }}
        />
      )}
    </>
  );
}

function getDiffString(future: Date, past: Date) {
  const diffMs = Math.abs(future.getTime() - past.getTime());
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours > 0) return `${hours}j ${mins}m`;
  return `${mins}m`;
}
