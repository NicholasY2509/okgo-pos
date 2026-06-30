"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useExistingPayment } from "../hooks/use-existing-payment";
import { CreditCard, CheckCircle2, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useTimetableStore } from "../stores/timetable-store";
import { NumericFormat } from "react-number-format";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CustomerCombobox } from "../../customer/components/customer-combobox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ExistingTransactionPaymentModal() {
  const {
    selectedTransactionForPayment: transaction,
    setSelectedTransactionForPayment,
    paymentMethods,
    fetchSessions
  } = useTimetableStore();


  const onClose = () => setSelectedTransactionForPayment(null);
  const onSuccess = () => {
    setSelectedTransactionForPayment(null);
    fetchSessions();
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
    handleSelectVoucher,
    handleAddManualVoucher,
    selectedVouchers,
    setSelectedVouchers,
    ownedVouchers,
    isLoadingVouchers,
    selectedCustomerId,
    setSelectedCustomerId
  } = useExistingPayment(transaction, paymentMethods, onSuccess, () => router.refresh());

  const normalMethods = paymentMethods.filter((pm: any) => pm.type !== "VOUCHER");
  const voucherMethod = paymentMethods.find((pm: any) => pm.type === "VOUCHER");
  const isVoucher = payment.paymentMethodId === voucherMethod?.id;

  const handleModeChange = (mode: string) => {
    if (mode === "VOUCHER" && voucherMethod) {
      handleUpdatePayment("paymentMethodId", voucherMethod.id);
    } else {
      handleUpdatePayment("paymentMethodId", "");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn(
        "gap-0 p-0 overflow-hidden flex flex-col bg-background sm:rounded-[24px] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] max-h-[90vh]",
        isVoucher ? "sm:max-w-[900px]" : "sm:max-w-[850px]"
      )}>
        <DialogHeader className="p-6 pb-4 border-b border-border/30 bg-muted/5 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl flex items-center gap-2 text-foreground font-semibold tracking-tight">
            <CreditCard className="w-5 h-5 text-primary" />
            Selesaikan Pembayaran
          </DialogTitle>
          {voucherMethod && (
            <Tabs value={isVoucher ? "VOUCHER" : "NORMAL"} onValueChange={handleModeChange} className="w-[300px]">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="NORMAL" className="rounded-lg h-9">Cash / EDC</TabsTrigger>
                <TabsTrigger value="VOUCHER" className="rounded-lg h-9">Redeem Voucher</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </DialogHeader>
        <div className={cn(
          "grid transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex-1 min-h-0",
          isVoucher ? "grid-cols-1 md:grid-cols-[1fr_0fr_1.3fr]" : "grid-cols-1 md:grid-cols-[1fr_1fr_0fr]"
        )}>
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

              {!isVoucher && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
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
              )}
            </div>

            {!isVoucher && (
              <div className="space-y-2 animate-in fade-in duration-300">
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
            )}


            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button
                className="w-full h-14 text-lg rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={() => {
                  if (payment.amount > 0 || payment.voucherCode) {
                    handleSubmit();
                  } else if ((transaction.paidAmount || 0) >= totalAmount) {
                    onSuccess();
                  } else {
                    handleSubmit(); // Will trigger the "masih kurang" error
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
                    {isVoucher ? "Redeem Voucher" : "Bayar Sekarang"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Middle Panel: Methods & Notes */}
          <div className={cn(
            "flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isVoucher ? "opacity-0" : "opacity-100"
          )}>
            <div className="w-full min-w-[350px] p-6 flex flex-col space-y-6 overflow-y-auto scrollbar-thin h-full">
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

              {(!isVoucher && (paymentMethods.find((pm: any) => pm.id === payment.paymentMethodId)?.type === "TRANSFER" || paymentMethods.find((pm: any) => pm.id === payment.paymentMethodId)?.type === "EDC" || paymentMethods.find((pm: any) => pm.id === payment.paymentMethodId)?.type === "QRIS")) && (
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

          {/* Third Panel: Voucher Options */}
          <div className={cn(
            "flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-muted/5",
            isVoucher ? "opacity-100 border-l border-border/30" : "opacity-0 border-l-0"
          )}>
            <div className="w-full min-w-[400px] p-5 flex flex-col space-y-4 h-full overflow-y-auto scrollbar-thin">
              <div className="space-y-2">
                <Label className="text-sm font-semibold tracking-tight">Kode Voucher Manual</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Masukkan kode voucher"
                    value={payment.voucherCode}
                    onChange={(e) => {
                      handleUpdatePayment("voucherCode", e.target.value);
                    }}
                  />
                  <Button
                    onClick={handleAddManualVoucher}
                    disabled={isSubmitting || !payment.voucherCode}
                  >
                    Tambah
                  </Button>
                </div>
              </div>

              {selectedVouchers.length > 0 && (
                <div className="space-y-3 mt-4 animate-in fade-in zoom-in-95 duration-200">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Voucher Terpilih ({selectedVouchers.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                    {selectedVouchers.map((voucher) => (
                      <div key={voucher.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 text-primary font-mono text-xs font-bold shadow-sm transition-all hover:border-primary/50">
                        {voucher.code}
                        <button
                          className="text-primary/70 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10 p-0.5"
                          onClick={() => handleSelectVoucher(voucher)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-4 flex-1 flex flex-col min-h-0 border-t border-border/40">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Voucher Pelanggan ({ownedVouchers?.length || 0})
                  </Label>
                  <CustomerCombobox
                    selectedCustomerId={selectedCustomerId}
                    onSelectCustomer={setSelectedCustomerId}
                  />
                </div>
                {isLoadingVouchers ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" /></div>
                ) : !ownedVouchers || ownedVouchers.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-2xl bg-background/50">
                    <p className="text-sm text-muted-foreground text-center font-medium">Pelanggan tidak memiliki voucher aktif.</p>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
                    {ownedVouchers.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                        <div>
                          <p className="font-mono text-sm font-medium tracking-tight text-foreground">{v.code}</p>
                        </div>
                        <Button
                          variant={selectedVouchers.some(sv => sv.code === v.code) ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isSubmitting}
                          onClick={() => handleSelectVoucher(v)}
                        >
                          {selectedVouchers.some(sv => sv.code === v.code) ? "Batal Pilih" : "Pilih"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
