"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, XCircle, CheckCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { updateBookingStatusAction } from "../actions/booking-list-actions";
import { EditBookingForm } from "./edit-booking-form";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface BookingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
}

export function BookingDetailDialog({ open, onOpenChange, booking }: BookingDetailDialogProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const params = useParams();

  const handleStatusUpdate = async (status: 'PROCESSED' | 'CANCELLED') => {
    if (!booking) return;
    const result = await updateBookingStatusAction(booking.id, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(status === 'PROCESSED' ? "Booking berhasil diproses." : "Booking berhasil dibatalkan.");
      onOpenChange(false);
      router.refresh();
    }
  };

  let hasStarted = false;
  if (booking) {
    const sessions = booking.serviceSessions || [];
    sessions.forEach((s: any) => {
      if (s.startTime) {
        const d = new Date(s.startTime);
        if (d <= new Date()) {
          hasStarted = true;
        }
      }
    });
  }

  if (!open && isEditing) {
    setIsEditing(false);
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Reservasi" : "Detail Reservasi"}</DialogTitle>
        </DialogHeader>

        {isEditing && booking ? (
          <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
            <EditBookingForm
              branchId={booking.branchId}
              booking={booking}
              onCancel={() => setIsEditing(false)}
              onSuccess={() => {
                setIsEditing(false);
                onOpenChange(false);
                router.refresh();
              }}
            />
          </div>
        ) : (
          <>
            {booking && (
              <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">No. Booking</p>
                    <p className="font-medium font-mono">{booking.bookingNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={booking.status === 'PENDING' ? 'outline' : booking.status === 'PROCESSED' ? 'default' : 'destructive'} className="mt-1">
                      {booking.status}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Pelanggan</h4>
                  <div className="text-sm">
                    <p className="font-medium">{booking.customerName || booking.customer?.name}</p>
                    <p className="text-muted-foreground">{booking.customerPhone || booking.customer?.phone}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Jadwal & Layanan</h4>
                  {booking.scheduledStartTime && (
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(booking.scheduledStartTime), "EEEE, d MMMM yyyy HH:mm", { locale: id })}
                    </div>
                  )}
                  <div className="space-y-2">
                    {booking.items?.map((item: any, i: number) => {
                      const session = booking.serviceSessions?.find((s: any) => s.serviceId === item.serviceId);
                      const hasVoucher = !!item.appliedVoucher;
                      return (
                        <div key={i} className="flex flex-col border p-3 rounded-lg bg-muted/20 space-y-2">
                          <div className="flex justify-between items-start text-sm">
                            <div>
                              <p className="font-medium">{item.itemNameSnapshot}</p>
                              <p className="text-xs text-muted-foreground">{item.categoryName || "Lainnya"}</p>
                              {session?.staff && (
                                <p className="text-muted-foreground text-xs mt-1">
                                  Terapis: {session.staff.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {hasVoucher ? (
                                <div className="text-xs text-muted-foreground line-through">
                                  {formatIDR(Number(item.unitPrice))}
                                </div>
                              ) : null}
                              <p className="font-medium">{formatIDR(hasVoucher ? 0 : Number(item.unitPrice))}</p>
                            </div>
                          </div>
                          {hasVoucher && (
                            <div className="flex items-center gap-2 bg-primary/5 text-primary text-xs px-2 py-1.5 rounded-md border border-primary/20 w-fit">
                              <Ticket className="w-3 h-3" />
                              <span>Voucher Layanan: <b>{item.appliedVoucher.code}</b></span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {booking.appliedVoucher && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2"><Ticket className="w-4 h-4" /> Detail Voucher</h4>
                    <div className="text-sm border p-3 rounded-lg bg-primary/5 border-primary/20 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kode Voucher</span>
                        <span className="font-medium">{booking.appliedVoucher.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Jenis Potongan</span>
                        <span className="font-medium text-right">
                          {booking.appliedVoucher.voucherPacket?.product
                            ? `Layanan (${booking.appliedVoucher.voucherPacket.product.name})`
                            : 'Potongan Nominal'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nominal Potongan</span>
                        <span className="font-medium text-primary">
                          {(() => {
                            const originalAmount = booking.items?.reduce((sum: number, item: any) => sum + Number(item.unitPrice * item.quantity), 0) || 0;
                            const totalAmount = Number(booking.totalAmount);
                            const discount = originalAmount - totalAmount;
                            return discount > 0 ? formatIDR(discount) : '-';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {booking.appliedVoucher && <Separator />}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <p>Subtotal Layanan</p>
                    <p>{(() => {
                      const originalAmount = booking.items?.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0) || 0;
                      return formatIDR(originalAmount);
                    })()}</p>
                  </div>
                  {booking.appliedVoucher && (
                    <div className="flex justify-between text-sm text-primary">
                      <p>Diskon Voucher</p>
                      <p>-{(() => {
                        const originalAmount = booking.items?.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0) || 0;
                        const totalAmount = Number(booking.totalAmount);
                        return formatIDR(originalAmount - totalAmount);
                      })()}</p>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <p>Total Bayar</p>
                    <p className="text-lg">{formatIDR(Number(booking.totalAmount))}</p>
                  </div>
                </div>
              </div>
            )}

            {booking && (
              <DialogFooter className="gap-2 sm:justify-between">
                <div className="flex gap-2 w-full sm:w-auto">
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
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Tutup
                  </Button>
                  {booking.status === 'PENDING' && (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-1.5" />
                      Edit Jadwal / Layanan
                    </Button>
                  )}
                </div>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );

}
