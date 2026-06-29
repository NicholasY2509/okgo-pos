import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarSessionCard } from "./sidebar-session-card";
import { SidebarBookingCard } from "./sidebar-booking-card";

interface TimetableSidebarProps {
  isOpen: boolean;
  sessions: any[];
  pendingBookings: any[];
  onProcessBooking: (bookingId: string) => void;
}

export function TimetableSidebar({
  isOpen,
  sessions,
  pendingBookings,
  onProcessBooking,
}: TimetableSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="w-80 shrink-0 bg-background flex flex-col">
      <Tabs defaultValue="sesi" className="flex-1 flex flex-col h-full">
        <div className="p-3 border-b border-border shrink-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sesi">Sesi Hari Ini</TabsTrigger>
            <TabsTrigger value="booking">
              Booking
              {pendingBookings?.length > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full"
                >
                  {pendingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="sesi"
          className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col"
        >
          <ScrollArea className="flex-1 p-3 h-full">
            <div className="flex flex-col gap-3">
              {sessions.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Tidak ada sesi hari ini.
                </div>
              ) : (
                sessions.map((session) => (
                  <SidebarSessionCard key={session.id} session={session} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="booking"
          className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col"
        >
          <ScrollArea className="flex-1 p-3 h-full">
            <div className="flex flex-col gap-3">
              {!pendingBookings || pendingBookings.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Tidak ada booking masuk.
                </div>
              ) : (
                pendingBookings.map((booking) => (
                  <SidebarBookingCard key={booking.id} booking={booking} onProcessBooking={onProcessBooking} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
