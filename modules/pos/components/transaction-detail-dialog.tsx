"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelTransactionAction } from "../actions/transaction-action";

interface TransactionDetailDialogProps {
  transaction: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionCancelled?: () => void;
}

export function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
  onTransactionCancelled,
}: TransactionDetailDialogProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!transaction) return null;

  const diffInMs = transaction.createdAt ? Date.now() - new Date(transaction.createdAt).getTime() : 0;
  const isPastTwoDays = diffInMs > 2 * 24 * 60 * 60 * 1000;
  const isCancelled = transaction.status === "CANCELLED" || transaction.status === "VOIDED";
  const hasUsedVouchers = Boolean(transaction.hasGeneratedVouchers && transaction.hasRedeemedVouchers);
  const canCancel = !isCancelled && !isPastTwoDays && !hasUsedVouchers;

  const handleCancelTransaction = async () => {
    setIsCancelling(true);
    try {
      const res = await cancelTransactionAction(transaction.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Transaksi berhasil dibatalkan.");
        setIsConfirmOpen(false);
        onOpenChange(false);
        onTransactionCancelled?.();
      }
    } catch {
      toast.error("Terjadi kesalahan saat membatalkan transaksi.");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detail Transaksi {transaction.transactionNumber}</span>
              <Badge
                variant={
                  transaction.status === "COMPLETED"
                    ? "default"
                    : isCancelled
                      ? "destructive"
                      : "secondary"
                }
              >
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
                  <span className="font-medium text-right">{transaction.cashier?.name || transaction.cashierName || transaction.cashierId || "-"}</span>

                  {(transaction.branch?.name || transaction.branchName) && (
                    <>
                      <span className="text-muted-foreground">Cabang</span>
                      <span className="font-medium text-right">{transaction.branch?.name || transaction.branchName}</span>
                    </>
                  )}
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

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 gap-2">
            <div className="text-xs text-muted-foreground">
              {isCancelled ? (
                <span className="text-destructive font-medium">Transaksi ini telah dibatalkan.</span>
              ) : isPastTwoDays ? (
                <span className="text-muted-foreground italic">
                  Transaksi telah melewati batas 2 hari dan tidak dapat dibatalkan.
                </span>
              ) : hasUsedVouchers ? (
                <span className="text-destructive font-medium">
                  Tidak dapat dibatalkan: {transaction.usedGeneratedVouchersCount} dari {transaction.totalGeneratedVouchers} voucher yang dibeli telah digunakan.
                </span>
              ) : transaction.hasGeneratedVouchers ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Semua ({transaction.totalGeneratedVouchers}) voucher paket belum digunakan (dapat dibatalkan).
                </span>
              ) : (
                <span>Pembatalan tersedia hingga 2 hari setelah transaksi dibuat.</span>
              )}
            </div>

            <div className="flex gap-2">
              {canCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isCancelling}
                  onClick={() => setIsConfirmOpen(true)}
                >
                  <Ban className="w-4 h-4 mr-1.5" />
                  Batalkan Transaksi
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan transaksi{" "}
              <strong className="text-foreground">{transaction.transactionNumber}</strong>?
              <br /><br />
              Tindakan ini akan:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>Mengubah status transaksi menjadi <strong>CANCELLED</strong></li>
                <li>Membatalkan seluruh sesi layanan terkait</li>
                {transaction.hasGeneratedVouchers && (
                  <li>Membatalkan seluruh ({transaction.totalGeneratedVouchers}) voucher paket yang belum digunakan (VOID)</li>
                )}
                {transaction.voucherRedemptions && transaction.voucherRedemptions.length > 0 && (
                  <li>Memulihkan kuota voucher yang di-redeem pada transaksi ini</li>
                )}
                <li>Menghapus insentif kasir/terapis terkait</li>
                <li>Membuat jurnal pembalik (reversal) pada sistem akuntansi</li>
              </ul>
              <br />
              Tindakan ini tidak dapat diurungkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Tutup</AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelTransaction}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Membatalkan...
                </>
              ) : (
                "Ya, Batalkan Transaksi"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
