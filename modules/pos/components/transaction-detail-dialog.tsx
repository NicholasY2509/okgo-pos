"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TransactionDetailDialogProps {
  transaction: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDialog({ transaction, open, onOpenChange }: TransactionDetailDialogProps) {
  if (!transaction) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detail Transaksi {transaction.transactionNumber}</span>
            <Badge variant={transaction.status === "COMPLETED" ? "default" : "secondary"}>
              {transaction.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4 text-sm">
          {/* Summary */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-muted-foreground mb-1">Informasi Umum</h4>
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-lg border">
                <span className="text-muted-foreground">Tanggal</span>
                <span className="font-medium text-right">{format(new Date(transaction.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}</span>

                <span className="text-muted-foreground">Pelanggan</span>
                <span className="font-medium text-right">{transaction.customer?.name || "Umum"}</span>

                <span className="text-muted-foreground">Kasir</span>
                <span className="font-medium text-right">{transaction.cashierId || "-"}</span>
              </div>
            </div>

            {/* Payments */}
            <div>
              <h4 className="font-semibold text-muted-foreground mb-1">Pembayaran</h4>
              <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
                {transaction.payments?.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center">
                    <span>{p.paymentMethod.name}</span>
                    <span className="font-medium">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
                {(!transaction.payments || transaction.payments.length === 0) && (
                  <div className="text-muted-foreground italic text-xs">Tidak ada pembayaran tunai/transfer.</div>
                )}
              </div>
            </div>

            {/* Voucher Redemptions */}
            {transaction.voucherRedemptions && transaction.voucherRedemptions.length > 0 && (
              <div>
                <h4 className="font-semibold text-muted-foreground mb-1">Redeem Voucher</h4>
                <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
                  {transaction.voucherRedemptions.map((vr: any) => (
                    <div key={vr.id} className="flex flex-col gap-1 text-xs">
                      <span className="font-semibold text-primary">{vr.customerVoucher?.voucherPacket?.name}</span>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kode: {vr.customerVoucher?.code}</span>
                        <span>{vr.redeemedVisitCount ? "1 Visit" : formatCurrency(vr.redeemedAmount || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Items & Total */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-muted-foreground mb-1">Item Pesanan</h4>
              <div className="space-y-3 bg-muted/30 p-3 rounded-lg border">
                {transaction.items?.map((item: any) => (
                  <div key={item.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between font-medium">
                      <span>{item.itemNameSnapshot} (x{item.quantity})</span>
                      <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                    {item.discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-red-500 mt-1">
                        <span>Diskon</span>
                        <span>-{formatCurrency(item.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold mt-1">
                      <span>Subtotal</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rincian Total */}
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Item</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Diskon</span>
                <span className="text-red-500">-{formatCurrency(transaction.discountTotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Pajak</span>
                <span>{formatCurrency(transaction.taxTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                <span>Total Akhir</span>
                <span>{formatCurrency(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground pt-2">
                <span>Jumlah Bayar</span>
                <span>{formatCurrency(transaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Kembalian</span>
                <span>{formatCurrency(transaction.changeAmount)}</span>
              </div>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
