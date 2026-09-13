"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { CurrentTimeLine } from "./current-time-line";
import { SessionCard } from "./session-card";
import { calculateSessionLanes } from "./timetable-utils";
import { useTimetableStore } from "../../stores/timetable-store";

export function TimetableGrid() {
  const {
    date,
    rooms,
    sessions,
    loading,
    businessHoursStart,
    totalHours,
  } = useTimetableStore();

  const hoursArray = Array.from({ length: totalHours }, (_, i) => i + businessHoursStart);

  return (
    <div className="flex-1 overflow-auto relative flex flex-col border-r border-border">
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
          rooms.map((room, roomIndex) => (
            <div key={`skeleton-${room.id}`} className="flex border-b border-border h-24">
              <div className="w-48 shrink-0 border-r border-border p-4 bg-background sticky left-0 z-20 shadow-[1px_0_0_0_hsl(var(--border))]">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="flex-1 flex isolate">
                {hoursArray.map((hour, hourIndex) => (
                  <div key={`skel-grid-${hour}`} className="flex-1 min-w-[120px] border-r border-border h-full flex items-center px-2">
                    {/* Deterministically place a skeleton to look like a loading session */}
                    {(hourIndex + roomIndex) % 4 === 0 && (
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
  );
}
