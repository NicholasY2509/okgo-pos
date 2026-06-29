import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface SidebarSessionCardProps {
  session: any;
}

export function SidebarSessionCard({ session }: SidebarSessionCardProps) {
  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors py-1">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-1 gap-2">
          <span className="font-semibold text-sm line-clamp-1">
            {session.itemName}
          </span>
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
        <div className="text-xs text-muted-foreground flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {session.startTime
                ? format(new Date(session.startTime), "HH:mm")
                : "--:--"}
              {session.endTime
                ? ` - ${format(new Date(session.endTime), "HH:mm")}`
                : ""}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="font-medium text-foreground">
              {session.customerName}
            </span>
            <span>{session.staff?.firstName || "-"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
