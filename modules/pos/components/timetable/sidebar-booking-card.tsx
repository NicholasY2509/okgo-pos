import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SidebarBookingCardProps {
  booking: any;
  onProcessBooking: (id: string) => void;
}

export function SidebarBookingCard({ booking, onProcessBooking }: SidebarBookingCardProps) {
  return (
    <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold text-sm">
            {booking.bookingNumber}
          </span>
          <Badge
            variant="outline"
            className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200"
          >
            PENDING
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground flex flex-col gap-1 mb-3">
          <div className="font-medium text-foreground">
            {booking.customer?.name ||
              booking.customerName ||
              "Tanpa Nama"}
          </div>
          <div className="text-muted-foreground">
            {booking.items.length} Layanan •{" "}
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(booking.totalAmount)}
          </div>
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={() => onProcessBooking(booking.id)}
        >
          Proses Booking
        </Button>
      </CardContent>
    </Card>
  );
}
