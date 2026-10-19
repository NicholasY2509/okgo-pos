import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarClock, Phone, User, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";

interface SidebarBookingCardProps {
  booking: any;
  onProcessBooking: (id: string) => void;
}

export function SidebarBookingCard({ booking, onProcessBooking }: SidebarBookingCardProps) {
  const customerName = booking.customer?.name || booking.customerName || "Tanpa Nama";
  const customerPhone = booking.customer?.phone || booking.customerPhone;
  const scheduledTime = booking.scheduledStartTime ? new Date(booking.scheduledStartTime) : null;

  return (
    <Card className="border border-border hover:bg-muted/30 py-0 transition-colors">
      <CardContent className="p-3.5 space-y-2.5">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="font-semibold text-sm text-foreground">
              {customerName}
            </div>
            {customerPhone && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <span>{customerPhone}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 h-4 bg-muted text-foreground border-border font-mono font-medium"
            >
              #{booking.bookingNumber ? booking.bookingNumber.slice(-4).toUpperCase() : "BKG"}
            </Badge>
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 h-4 font-medium"
            >
              {!booking.isAssignedToTimetable ? "Belum Ditugaskan" : "Terjadwal"}
            </Badge>
          </div>
        </div>

        {scheduledTime && (
          <div className="flex items-center gap-1.5 text-xs text-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/40 font-medium">
            <CalendarClock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{format(scheduledTime, "EEEE, d MMM yyyy • HH:mm", { locale: id })}</span>
          </div>
        )}

        {/* Services & Staff */}
        <div className="space-y-1 pt-1 border-t border-border/50 text-xs">
          <div className="text-muted-foreground font-medium text-[11px]">
            Layanan ({booking.items?.length || 0}):
          </div>
          <div className="space-y-1">
            {booking.items?.map((item: any, i: number) => {
              const staffName = item.requestedStaff?.firstName || item.requestedStaff?.name;
              return (
                <div key={i} className="flex items-center justify-between text-xs bg-muted/20 px-2 py-1 rounded">
                  <span className="font-medium text-foreground truncate max-w-[65%]">
                    {item.itemNameSnapshot}
                  </span>
                  {staffName ? (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                      <User className="w-3 h-3 shrink-0" />
                      {staffName}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60 italic">Bebas</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
          <span className="text-muted-foreground">Total Biaya</span>
          <span className="font-semibold text-foreground text-sm font-mono">
            {formatIDR(Number(booking.totalAmount || 0))}
          </span>
        </div>

        <Button
          size="sm"
          className="w-full h-8 text-xs font-medium"
          onClick={() => onProcessBooking(booking.id)}
        >
          Tugaskan ke Jadwal
        </Button>
      </CardContent>
    </Card>
  );
}
