"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Eye, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateBookingStatusAction } from "../actions/booking-list-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface BookingActionCellProps {
  booking: any;
}

export function BookingActionCell({ booking }: BookingActionCellProps) {
  const [open, setOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const router = useRouter();

  const handleStatusUpdate = async (status: 'PROCESSED' | 'CANCELLED') => {
    const result = await updateBookingStatusAction(booking.id, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(status === 'PROCESSED' ? "Booking berhasil diproses." : "Booking berhasil dibatalkan.");
      setOpen(false);
      router.refresh();
    }
  };
  
  // check if started
  let hasStarted = false;
  const sessions = booking.serviceSessions || [];
  sessions.forEach((s: any) => {
    if (s.startTime) {
      const d = new Date(s.startTime);
      if (d <= new Date()) {
        hasStarted = true;
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 text-xs font-medium">
          <Eye className="w-3.5 h-3.5 mr-1" />
          Detail
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detail Booking</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">No. Booking</p>
              <p className="font-medium font-mono">{booking.bookingNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge 
                variant="secondary" 
                className={`text-[10px] uppercase ${
                  booking.status === 'PENDING' ? 'bg-orange-500/10 text-orange-600' : 
                  booking.status === 'PROCESSED' ? 'bg-blue-500/10 text-blue-600' : 
                  'bg-gray-500/10 text-gray-600'
                }`}
              >
                {booking.status}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Pelanggan</p>
              <p className="font-medium">{booking.customer?.name || booking.customerName || "-"}</p>
              <p className="text-muted-foreground text-xs">{booking.customer?.phone || booking.customerPhone || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dibuat Pada</p>
              <p className="font-medium">{format(new Date(booking.createdAt), "dd MMM yy HH:mm", { locale: id })}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold text-sm mb-3">Layanan ({booking.items?.length || 0})</h4>
            <div className="space-y-3">
              {booking.items?.map((item: any, idx: number) => {
                const itemSessions = booking.serviceSessions?.filter((s: any) => s.serviceId === item.serviceId) || [];
                return (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium">{item.itemNameSnapshot}</p>
                      {itemSessions.map((session: any, sIdx: number) => (
                        <div key={sIdx} className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {session.startTime ? format(new Date(session.startTime), "dd MMM yy HH:mm", { locale: id }) : "Belum dijadwalkan"}
                        </div>
                      ))}
                    </div>
                    <p className="font-medium">{formatIDR(Number(item.subtotal || 0))}</p>
                  </div>
                );
              })}
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold">
            <p>Total Bayar</p>
            <p>{formatIDR(Number(booking.totalAmount))}</p>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {!hasStarted && booking.status === 'PENDING' && (
              <>
                <Button variant="destructive" onClick={() => setShowCancelConfirm(true)} className="w-full sm:w-auto">
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Batalkan
                </Button>
                <ConfirmDialog
                  open={showCancelConfirm}
                  onOpenChange={setShowCancelConfirm}
                  title="Batalkan Booking?"
                  description="Apakah Anda yakin ingin membatalkan booking ini? Tindakan ini tidak dapat dibatalkan."
                  cancelText="Kembali"
                  confirmText="Ya, Batalkan"
                  variant="destructive"
                  onConfirm={() => {
                    handleStatusUpdate('CANCELLED');
                  }}
                />
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Tutup
            </Button>
            {booking.status === 'PENDING' && (
              <Button onClick={() => handleStatusUpdate('PROCESSED')}>
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Proses
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
