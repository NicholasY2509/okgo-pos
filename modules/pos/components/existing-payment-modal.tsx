"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useExistingPayment } from "../hooks/use-existing-payment";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { useRouter } from "next/navigation";

interface ExistingTransactionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  paymentMethods: any[];
  onSuccess: () => void;
}

export function ExistingTransactionPaymentModal({ isOpen, onClose, transaction, paymentMethods, onSuccess }: ExistingTransactionPaymentModalProps) {
  const router = useRouter();
  
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
    handleSubmit
  } = useExistingPayment(transaction, paymentMethods, onSuccess, () => router.refresh());

  const selectedMethod = paymentMethods.find(pm => pm.id === payment.paymentMethodId);
  const isVoucher = selectedMethod?.type === "VOUCHER";
  const isTransferOrEDC = selectedMethod?.type === "TRANSFER" || selectedMethod?.type === "EDC" || selectedMethod?.type === "QRIS";

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="text-xl flex items-center gap-2 text-foreground font-medium">
            <CreditCard className="w-5 h-5 text-primary" />
            Selesaikan Pembayaran
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Panel: Summary & Input */}
          <div className="p-6 border-r border-border/40 bg-muted/5 flex flex-col space-y-6">
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

              <div className="border-t border-border/60 mt-1 pt-2 flex justify-between items-center">
                <span className="font-medium text-muted-foreground ml-auto">Sisa Tagihan</span>
                <span className="w-32 text-right font-medium">{remaining.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="font-medium text-primary ml-auto">Kembalian</span>
                <span className="w-32 text-right font-medium text-primary">{changeAmount.toLocaleString('id-ID')}</span>
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
                />
              </div>
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button
                className="w-full h-14 text-lg rounded-xl font-medium"
                onClick={handleSubmit}
                disabled={isSubmitting || totalPaid < totalAmount || !payment.paymentMethodId}
              >
                {isSubmitting ? "Memproses..." : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Bayar Sekarang
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel: Methods & Notes */}
          <div className="p-6 flex flex-col space-y-6">
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground font-medium">Metode Pembayaran</Label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map(pm => {
                  const isSelected = payment.paymentMethodId === pm.id;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => handleUpdatePayment("paymentMethodId", pm.id)}
                      className={`
                        p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 flex items-center gap-2
                        ${isSelected
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border/50 bg-background text-foreground hover:border-primary/40'}
                      `}
                    >
                      <div className={`w-3 h-3 rounded-full shrink-0 ${isSelected ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
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
                className=""
                rows={3}
                value={payment.notes}
                onChange={(e) => handleUpdatePayment("notes", e.target.value)}
              />
            </div>

            {isVoucher && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-sm text-muted-foreground font-medium">Kode Voucher</Label>
                <Input
                  placeholder="Masukkan kode (cth. VCH-12345)"
                  className="h-12 bg-background uppercase font-medium border-2 rounded-xl"
                  value={payment.voucherCode}
                  onChange={(e) => handleUpdatePayment("voucherCode", e.target.value)}
                />
              </div>
            )}

            {isTransferOrEDC && (
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
      </DialogContent>
    </Dialog>
  );
}
