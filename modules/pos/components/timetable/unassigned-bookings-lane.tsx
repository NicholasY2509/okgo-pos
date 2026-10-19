"use client";

import { useMemo } from "react";
import { format, addMinutes } from "date-fns";
import { CalendarClock, User, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UnassignedBookingsLaneProps {
  bookings: any[];
  hoursArray: number[];
  businessHoursStart: number;
  totalHours: number;
  onAssignBooking: (booking: any) => void;
}

export function UnassignedBookingsLane({
  bookings,
  hoursArray,
  businessHoursStart,
  totalHours,
  onAssignBooking,
}: UnassignedBookingsLaneProps) {
  const businessHoursEnd = businessHoursStart + totalHours;

  const { positioned, maxLane } = useMemo(() => {
    const sorted = [...bookings].sort(
      (a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
    );
    const lanes: any[][] = [];

    const positionedBookings = sorted.map((booking) => {
      const start = new Date(booking.scheduledStartTime).getTime();
      const duration = booking.estimatedDuration || 60;
      const end = start + duration * 60 * 1000;

      let assignedLane = 0;
      while (true) {
        if (!lanes[assignedLane]) {
          lanes[assignedLane] = [];
          break;
        }

        const overlap = lanes[assignedLane].some((b) => {
          const bStart = new Date(b.scheduledStartTime).getTime();
          const bDuration = b.estimatedDuration || 60;
          const bEnd = bStart + bDuration * 60 * 1000;
          return start < bEnd && end > bStart;
        });

        if (!overlap) break;
        assignedLane++;
      }

      lanes[assignedLane].push(booking);
      return { ...booking, lane: assignedLane };
    });

    return {
      positioned: positionedBookings,
      maxLane: lanes.length > 0 ? lanes.length - 1 : 0,
    };
  }, [bookings]);

  const rowHeight = bookings.length > 0 ? Math.max(88, (maxLane + 1) * 78 + 12) : 56;

  return (
    <div className="flex border-b border-border hover:bg-muted/5 group">
      {/* Sticky Left Header */}
      <div className="w-48 shrink-0 border-r border-border p-3 flex items-center justify-between bg-background sticky left-0 z-20 shadow-[1px_0_0_0_hsl(var(--border))] isolate">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">Booking Masuk</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Belum ditugaskan</span>
          </div>
        </div>
        {bookings.length > 0 && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-4 font-mono font-medium"
          >
            {bookings.length}
          </Badge>
        )}
      </div>

      {/* Grid Lane Body */}
      <div className="flex-1 relative z-0 flex isolate" style={{ minHeight: `${rowHeight}px` }}>
        {/* Grid Hour Lines */}
        {hoursArray.map((hour) => (
          <div
            key={hour}
            className="flex-1 min-w-[120px] border-r border-border"
            style={{ height: `${rowHeight}px` }}
          />
        ))}

        {/* If no unassigned bookings for this day */}
        {bookings.length === 0 && (
          <div className="absolute inset-0 flex items-center px-4 text-xs text-muted-foreground/60 italic pointer-events-none select-none">
            Tidak ada booking belum ditugaskan untuk tanggal ini.
          </div>
        )}

        {/* Positioned Booking Cards */}
        {positioned.map((booking) => {
          if (!booking.scheduledStartTime) return null;
          const start = new Date(booking.scheduledStartTime);
          const duration = booking.estimatedDuration || 60;
          const end = addMinutes(start, duration);

          const startHour = start.getHours() + start.getMinutes() / 60;
          const endHour = end.getHours() + end.getMinutes() / 60;

          if (startHour >= businessHoursEnd || endHour <= businessHoursStart) {
            return null;
          }

          const clampedStart = Math.max(businessHoursStart, Math.min(startHour, businessHoursEnd));
          const clampedEnd = Math.max(businessHoursStart, Math.min(endHour, businessHoursEnd));

          const left = ((clampedStart - businessHoursStart) / totalHours) * 100;
          const width = Math.max(9, ((clampedEnd - clampedStart) / totalHours) * 100);

          const requestedStaffName = booking.items?.find((i: any) => i.requestedStaff)?.requestedStaff?.firstName;

          return (
            <div
              key={booking.id}
              onClick={() => onAssignBooking(booking)}
              className="absolute rounded-lg p-2.5 flex flex-col justify-between overflow-hidden border border-dashed border-border bg-card hover:bg-muted/40 hover:border-foreground/30 transition-all cursor-pointer shadow-xs group/bcard z-10"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                top: `${booking.lane * 78 + 6}px`,
                height: "68px",
                minWidth: "140px",
              }}
            >
              <div className="flex items-center justify-between gap-1 select-none">
                <div className="flex items-center gap-1.5 truncate">
                  <Badge
                    variant="outline"
                    className="text-[8px] px-1 py-0 h-3.5 bg-muted/60 text-foreground border-border uppercase font-semibold shrink-0"
                  >
                    Booking
                  </Badge>
                  <span
                    className="font-semibold text-xs text-foreground truncate"
                    title={booking.customerName || booking.customer?.name}
                  >
                    {booking.customerName || booking.customer?.name || "Booking Online"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-5 px-1.5 text-[9px] text-foreground hover:bg-muted rounded gap-0.5 shrink-0 font-medium"
                >
                  Tugaskan
                  <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                </Button>
              </div>

              <div className="text-[10px] text-muted-foreground flex items-center justify-between gap-1 mt-auto select-none">
                <div className="flex items-center gap-1.5 truncate text-foreground font-medium">
                  <span className="truncate text-muted-foreground">
                    {booking.items?.[0]?.itemNameSnapshot || "Layanan"}
                    {booking.items?.length > 1 ? ` (+${booking.items.length - 1})` : ""}
                  </span>
                  {requestedStaffName && (
                    <span className="text-muted-foreground text-[9px]">
                      • Terapis: {requestedStaffName}
                    </span>
                  )}
                </div>
                <span className="font-mono text-muted-foreground font-medium whitespace-nowrap">
                  {format(start, "HH:mm")} - {format(end, "HH:mm")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
