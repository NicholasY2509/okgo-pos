"use client";

import { format, addDays, subDays } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { CurrentTimeLine } from "./timetable/current-time-line";
import { SessionCard } from "./timetable/session-card";
import { calculateSessionLanes, BUSINESS_HOURS_START, BUSINESS_HOURS_END, TOTAL_HOURS } from "./timetable/timetable-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminBookingForm } from "../../booking/components/admin-booking-form";
import { useTimetable } from "../hooks/use-timetable";

interface TimetableClientProps {
  branchId: string;
  rooms: any[];
  paymentMethods: any[];
}

export function TimetableClient({ branchId, rooms, paymentMethods }: TimetableClientProps) {
  const {
    date,
    setDate,
    sessions,
    loading,
    isBookingModalOpen,
    setIsBookingModalOpen,
    fetchSessions,
    handleComplete,
    handleStart,
    handleUpdateSessionTime,
  } = useTimetable({ branchId });

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
          <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
            <DialogTrigger asChild>
              <Button className="mr-2">
                <Plus className="w-4 h-4 mr-2" />
                Buat Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Buat Booking Baru</DialogTitle>
              </DialogHeader>
              <AdminBookingForm
                branchId={branchId}
                onSuccess={() => {
                  setIsBookingModalOpen(false);
                  fetchSessions(date);
                }}
                onCancel={() => setIsBookingModalOpen(false)}
              />
            </DialogContent>
          </Dialog>

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
        <div className="flex-1 flex flex-col min-w-max relative pb-4 pt-4">

          <CurrentTimeLine date={date} />

          {loading ? (
            rooms.map((room) => (
              <div key={`skeleton-${room.id}`} className="flex border-b border-border h-24">
                <div className="w-48 shrink-0 border-r border-border p-4 bg-background sticky left-0 z-20 shadow-[1px_0_0_0_hsl(var(--border))]">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex-1 flex isolate">
                  {hoursArray.map(hour => (
                    <div key={`skel-grid-${hour}`} className="flex-1 min-w-[120px] border-r border-border h-full flex items-center px-2">
                      {/* Randomly place a skeleton to look like a loading session */}
                      {Math.random() > 0.7 && (
                        <Skeleton className="h-12 w-full rounded-md opacity-50" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            rooms.map(room => {
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
                        onStart={() => handleStart(session.id)}
                        onUpdateTime={(start, end) => handleUpdateSessionTime(session.id, start, end)}
                        paymentMethods={paymentMethods}
                        onPaymentSuccess={() => fetchSessions(date)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {rooms.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">Belum ada ruang terdaftar.</div>
          )}
        </div>
      </div>
    </div>
  );
}

