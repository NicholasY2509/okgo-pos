"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useExistingPayment } from "../hooks/use-existing-payment";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { useTimetableStore } from "../stores/timetable-store";
import { io } from "socket.io-client";
import { NumericFormat } from "react-number-format";
import { useRouter } from "next/navigation";

export function ExistingTransactionPaymentModal() {
  const {
    branchId,
    selectedTransactionForPayment: transaction,
    setSelectedTransactionForPayment,
    paymentMethods,
    fetchSessions,
    fetchPendingBookings
  } = useTimetableStore();


  const onClose = () => setSelectedTransactionForPayment(null);
  const onSuccess = () => {
    const wasPendingBookingAssignment = !!transaction?.isPendingBookingAssignment;
    setSelectedTransactionForPayment(null);
    fetchSessions();
    if (wasPendingBookingAssignment) {
      fetchPendingBookings();
      const socket = io(
        process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined
      );
      socket.emit("service_assigned", { branchId });
      setTimeout(() => socket.disconnect(), 1000);
    }
  };

  if (!transaction) return null;

  return (
    <ExistingTransactionPaymentModalContent
      transaction={transaction}
      paymentMethods={paymentMethods}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function ExistingTransactionPaymentModalContent({
  transaction,
  paymentMethods,
  onClose,
  onSuccess
}: {
  transaction: any,
  paymentMethods: any[],
  onClose: () => void,
  onSuccess: () => void
}) {
  const router = useRouter();
  const isOpen = !!transaction;

  const {
    payment,
    isSubmitting,
    totalAmount,
    subtotal,
    discountTotal,
    totalPaid,
    remaining,
    changeAmount,
    handleUpdatePayment,
    handleSubmit,
  } = useExistingPayment(transaction, paymentMethods, onSuccess, () => router.refresh());

  const normalMethods = paymentMethods.filter((pm: any) => pm.type !== "VOUCHER");

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[850px] gap-0 p-0 overflow-hidden flex flex-col bg-background sm:rounded-[24px] shadow-2xl max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b border-border/30 bg-muted/5 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl flex items-center gap-2 text-foreground font-semibold tracking-tight">
            <CreditCard className="w-5 h-5 text-primary" />
            Selesaikan Pembayaran
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-[550px]">
          {/* Left Panel: Summary & Input */}
          <div className="p-6 border-r border-border/40 bg-muted/5 flex flex-col space-y-6 overflow-y-auto scrollbar-thin">

            {transaction.items && transaction.items.length > 0 && (
              <div className="bg-card rounded-2xl p-5 border border-border/50 space-y-3 text-sm shadow-sm">
                <h4 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Detail Item</h4>
                <div className="space-y-3">
                  {transaction.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{item.itemNameSnapshot} x{item.quantity}</span>
                      <span className="text-muted-foreground font-medium">Rp {Number(item.subtotal).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-card rounded-2xl p-5 border border-border/50 space-y-2 text-base shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground ml-auto">Total</span>
                <span className="w-32 text-right font-medium">{subtotal.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-muted-foreground text-sm font-medium">
                    Discount ({subtotal > 0 ? Math.round((discountTotal / subtotal) * 100) : 0}%)
                  </span>
                </div>
                <span className="w-32 text-right font-medium">({discountTotal.toLocaleString('id-ID')})</span>
              </div>

              <div className="border-t border-border/60 mt-2 pt-2 flex justify-between items-center">
                <span className="font-medium text-muted-foreground ml-auto">Grand Total</span>
                <span className="w-32 text-right font-medium">{totalAmount.toLocaleString('id-ID')}</span>
              </div>

              <div>
                <div className="border-t border-border/60 mt-1 pt-2 flex justify-between items-center">
                  <span className="font-medium text-muted-foreground ml-auto">Telah Dibayar</span>
                  <span className="w-32 text-right font-medium">{(transaction.paidAmount || 0).toLocaleString('id-ID')}</span>
                </div>

                <div className="border-t border-border/60 mt-1 pt-2 flex justify-between items-center">
                  <span className="font-medium text-muted-foreground ml-auto">Sisa Tagihan</span>
                  <span className="w-32 text-right font-medium">{remaining.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="font-medium text-primary ml-auto">Kembalian</span>
                  <span className="w-32 text-right font-medium text-primary">{changeAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground font-medium">Uang Diterima</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-medium">Rp</span>
                <NumericFormat
                  value={payment.amount === 0 ? "" : payment.amount}
                  onValueChange={(values) => {
                    handleUpdatePayment("amount", values.floatValue || 0);
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  allowNegative={false}
                  customInput={Input}
                  className="h-14 pl-11 text-xl text-foreground focus-visible:ring-primary/30 border-2 rounded-xl"
                  onFocus={(e: any) => e.target.select()}
                  disabled={remaining <= 0}
                />
              </div>
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button
                className="w-full h-14 text-lg rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={() => {
                  if (payment.amount > 0 || transaction.isPendingBookingAssignment) {
                    handleSubmit();
                  } else if ((transaction.paidAmount || 0) >= totalAmount) {
                    onSuccess();
                  } else {
                    handleSubmit();
                  }
                }}
                disabled={isSubmitting || (payment.amount > 0 && !payment.paymentMethodId)}
              >
                {(transaction.paidAmount || 0) >= totalAmount && payment.amount === 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Selesai
                  </>
                ) : isSubmitting ? "Memproses..." : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Bayar Sekarang
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel: Methods & Notes */}
          <div className="flex flex-col overflow-hidden">
            <div className="w-full p-6 flex flex-col space-y-6 overflow-y-auto scrollbar-thin h-full">
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground font-medium">Metode Pembayaran</Label>
                <div className="grid grid-cols-2 gap-3">
                  {normalMethods.map((pm: any) => {
                    const isSelected = payment.paymentMethodId === pm.id;
                    return (
                      <div
                        key={pm.id}
                        onClick={() => handleUpdatePayment("paymentMethodId", pm.id)}
                        className={`
                        p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 flex items-center gap-3
                        ${isSelected
                            ? 'border-primary bg-primary/5 text-primary font-semibold shadow-sm'
                            : 'border-border/40 bg-background text-foreground hover:border-primary/40 hover:bg-muted/10'}
                      `}
                      >
                        <div className={`w-4 h-4 rounded-full shrink-0 transition-colors ${isSelected ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                        <span className="text-sm truncate">{pm.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground font-medium">Deskripsi / Catatan (Opsional)</Label>
                <Textarea
                  placeholder="Tambahkan catatan"
                  className="bg-background rounded-xl border-2"
                  rows={2}
                  value={payment.notes}
                  onChange={(e) => handleUpdatePayment("notes", e.target.value)}
                />
              </div>

              {(paymentMethods.find((pm: any) => pm.id === payment.paymentMethodId)?.type === "TRANSFER" || paymentMethods.find((pm: any) => pm.id === payment.paymentMethodId)?.type === "EDC" || paymentMethods.find((pm: any) => pm.id === payment.paymentMethodId)?.type === "QRIS") && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-sm text-muted-foreground font-medium">No Referensi Transaksi</Label>
                  <Input
                    placeholder="Opsional (cth. 938474)"
                    className="h-12 bg-background font-medium border-2 rounded-xl"
                    value={payment.referenceNumber}
                    onChange={(e) => handleUpdatePayment("referenceNumber", e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
