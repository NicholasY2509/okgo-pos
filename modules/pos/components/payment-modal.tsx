"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePosCart } from "../stores/pos-store";
import { usePosPayment } from "../hooks/use-pos-payment";
import { toast } from "sonner";
import { Trash2, CreditCard, Receipt, PlusCircle, CheckCircle2 } from "lucide-react";
import { NumericFormat } from "react-number-format";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  paymentMethods: any[];
  onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, branchId, paymentMethods, onSuccess }: PaymentModalProps) {
  const cart = usePosCart();
  const {
    payment,
    isSubmitting,
    totalPaid,
    remaining,
    changeAmount,
    isZeroTotal,
    hasVoucherPacket,
    handleUpdatePayment,
    handleSubmit
  } = usePosPayment(cart, branchId, paymentMethods, onSuccess);

  const selectedMethod = paymentMethods.find(pm => pm.id === payment.paymentMethodId);
  const isVoucher = selectedMethod?.type === "VOUCHER";
  const isTransferOrEDC = selectedMethod?.type === "TRANSFER" || selectedMethod?.type === "EDC" || selectedMethod?.type === "QRIS";

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden bg-background gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 border-b border-border/40 bg-muted/10 shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2 text-foreground font-medium">
            <CreditCard className="w-5 h-5 text-primary" />
            Selesaikan Pembayaran
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto flex-1">
          {/* Left Panel: Summary & Input */}
          <div className="p-6 border-r border-border/40 bg-muted/5 flex flex-col space-y-6">
            <div className="bg-card rounded-xl p-4 border shadow-sm space-y-3">
              {/* Order Details */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Rincian Transaksi</div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">Total Layanan ({cart.items.length} item)</span>
                  <span className="font-medium">Rp {(cart.subtotal - (cart.isVipUpgrade ? 80000 : 0)).toLocaleString('id-ID')}</span>
                </div>
                {cart.isVipUpgrade && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Upgrade VIP</span>
                    <span className="font-medium">Rp 80.000</span>
                  </div>
                )}
              </div>

              {/* Discounts & Promos */}
              {(cart.itemDiscountTotal > 0 || cart.appliedPromos.length > 0 || cart.voucherNominalDiscount > 0) && (
                <>
                  <div className="border-t border-border/50 border-dashed" />
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Potongan & Promo</div>

                    {cart.itemDiscountTotal > 0 && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>Diskon Manual</span>
                        <span className="font-medium">-Rp {cart.itemDiscountTotal.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    {cart.appliedPromos?.map((promo: any) => (
                      <div key={promo.promoId} className="flex justify-between text-sm text-primary">
                        <span className="truncate pr-2">Promo: {promo.name}</span>
                        <span className="font-medium whitespace-nowrap">-Rp {promo.discountAmount?.toLocaleString('id-ID') || 0}</span>
                      </div>
                    ))}

                    {cart.voucherNominalDiscount > 0 && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>Voucher Nominal</span>
                        <span className="font-medium">-Rp {cart.voucherNominalDiscount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Totals */}
              <div className="border-t border-border pt-3 mt-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Pajak (0%)</span>
                  <span className="text-sm font-medium">Rp 0</span>
                </div>
                <div className="flex justify-between items-center text-base">
                  <span className="font-bold text-foreground">Total Tagihan</span>
                  <span className="font-bold text-lg">Rp {(cart.amountDue ?? cart.totalAmount).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {!isZeroTotal && (
                <div className="pt-2 flex gap-4 text-sm bg-muted/30 p-2.5 rounded-lg border border-border/50">
                  <div className="flex-1">
                    <div className="text-muted-foreground text-xs mb-0.5">Kekurangan</div>
                    <div className="font-semibold text-red-500">Rp {remaining.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="w-px bg-border/80" />
                  <div className="flex-1">
                    <div className="text-muted-foreground text-xs mb-0.5">Kembalian</div>
                    <div className="font-semibold text-green-600">Rp {changeAmount.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              )}
            </div>

            {!isZeroTotal && (
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
            )}


          </div>

          {/* Right Panel: Methods & Notes */}
          <div className="p-6 flex flex-col space-y-6">
            {!isZeroTotal && (
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
            )}

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

            <div className="mt-auto flex flex-row w-full gap-2">
              {!isZeroTotal && !hasVoucherPacket && (
                <Button
                  variant="outline"
                  className="w-1/2"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                >
                  Bayar Nanti & Mulai Sesi
                </Button>
              )}

              <Button
                className="w-1/2"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || (!isZeroTotal && (totalPaid < (cart.amountDue ?? cart.totalAmount) || !payment.paymentMethodId))}
              >
                {isSubmitting ? "Memproses..." : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {isZeroTotal ? "Selesaikan Penukaran" : "Bayar Sekarang"}
                  </>
                )}
              </Button>


            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
