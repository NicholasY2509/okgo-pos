import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, Play } from "lucide-react";
import { toast } from "sonner";

interface SessionInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: any;
  onStart: () => void;
  onComplete: () => void;
  onPayNow: () => void;
}

export function SessionInfoDialog({
  open,
  onOpenChange,
  session,
  onStart,
  onComplete,
  onPayNow,
}: SessionInfoDialogProps) {
  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Informasi Sesi</DialogTitle>
          <DialogDescription>
            Detail sesi untuk {session.itemName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div className="text-sm text-muted-foreground">Pelanggan</div>
            <div className="col-span-2 font-medium">{session.customerName}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div className="text-sm text-muted-foreground">Layanan</div>
            <div className="col-span-2 font-medium">{session.itemName}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div className="text-sm text-muted-foreground">Terapis</div>
            <div className="col-span-2 font-medium">
              {session.staff ? `${session.staff.firstName} ${session.staff.lastName}` : "-"}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div className="text-sm text-muted-foreground">Waktu Mulai</div>
            <div className="col-span-2 font-medium">
              {new Date(session.startTime).toLocaleString("id-ID")}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div className="text-sm text-muted-foreground">
              {session.status === "COMPLETED" ? "Waktu Selesai" : "Estimasi Waktu Selesai"}
            </div>
            <div className="col-span-2 font-medium">
              {session.endTime ? new Date(session.endTime).toLocaleString("id-ID") : "-"}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="col-span-2 font-medium">
              <Badge
                variant={
                  session.status === "COMPLETED"
                    ? "secondary"
                    : session.status === "IN_PROGRESS"
                    ? "default"
                    : "outline"
                }
              >
                {session.status === "COMPLETED"
                  ? "Selesai"
                  : session.status === "IN_PROGRESS"
                  ? "Berlangsung"
                  : "Terjadwal"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-4 border-t mt-4">
            {session.status === "SCHEDULED" && (
              <Button
                className="w-full"
                onClick={() => {
                  onStart();
                  onOpenChange(false);
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Mulai Sesi
              </Button>
            )}
            {session.status === "IN_PROGRESS" && (
              <Button
                className="w-full"
                onClick={() => {
                  if (session.paymentStatus === "PENDING") {
                    toast.error("Tidak dapat menyelesaikan sesi. Pembayaran belum lunas.");
                    return;
                  }
                  onComplete();
                  onOpenChange(false);
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Selesaikan Sesi
              </Button>
            )}
            {session.paymentStatus === "PENDING" && (
              <Button
                className="w-full"
                variant={session.status === "COMPLETED" ? "default" : "outline"}
                onClick={() => {
                  onPayNow();
                  onOpenChange(false);
                }}
              >
                Bayar Sekarang
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
