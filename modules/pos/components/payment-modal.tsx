"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePosCart } from "../stores/pos-store";
import { createPosTransactionAction } from "../actions/pos-action";
import { toast } from "sonner";
import { Trash2, CreditCard, Receipt, PlusCircle, CheckCircle2 } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: ReturnType<typeof usePosCart>;
  branchId: string;
  paymentMethods: any[];
  onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, cart, branchId, paymentMethods, onSuccess }: PaymentModalProps) {
  const [payments, setPayments] = useState<any[]>([{ id: Date.now(), paymentMethodId: "", amount: 0, referenceNumber: "", voucherCode: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const remaining = Math.max(0, cart.totalAmount - totalPaid);
  const changeAmount = Math.max(0, totalPaid - cart.totalAmount);

  const handleAddPayment = () => {
    setPayments([...payments, { id: Date.now(), paymentMethodId: "", amount: remaining, referenceNumber: "", voucherCode: "" }]);
  };

  const handleRemovePayment = (id: number) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleUpdatePayment = (id: number, field: string, value: any) => {
    setPayments(payments.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async () => {
    if (totalPaid < cart.totalAmount) {
      toast.error("Jumlah bayar masih kurang.");
      return;
    }

    // Validate payments
    for (const p of payments) {
      if (!p.paymentMethodId) {
        toast.error("Pilih metode pembayaran untuk semua entri.");
        return;
      }
      if (p.amount <= 0) {
        toast.error("Jumlah pembayaran harus lebih dari 0.");
        return;
      }
      const pm = paymentMethods.find(x => x.id === p.paymentMethodId);
      if (pm?.type === "VOUCHER" && !p.voucherCode) {
        toast.error("Kode voucher wajib diisi untuk pembayaran dengan voucher.");
        return;
      }
    }

    setIsSubmitting(true);
    
    const payload = {
      branchId,
      customerId: cart.customerId,
      items: cart.items.map(i => ({
        type: i.type,
        serviceId: i.type === "SERVICE" ? i.serviceId : undefined,
        voucherPacketId: i.type === "VOUCHER_PACKET" ? i.voucherPacketId : undefined,
        quantity: i.quantity,
        staffId: i.staffId,
        roomId: i.roomId,
        discountAmount: i.discountAmount
      })) as any,
      payments: payments.map(p => ({
        paymentMethodId: p.paymentMethodId,
        amount: Number(p.amount),
        referenceNumber: p.referenceNumber || undefined,
        voucherCode: p.voucherCode || undefined
      }))
    };

    const res = await createPosTransactionAction(payload);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Transaksi berhasil disimpan!");
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 border-b border-border bg-muted/20">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <CreditCard className="w-6 h-6 text-primary" />
            Selesaikan Pembayaran
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-5 h-full">
          {/* Summary Panel - Left Side */}
          <div className="md:col-span-2 bg-muted/30 p-6 border-r border-border flex flex-col">
            <div className="bg-primary p-6 rounded-2xl shadow-sm text-primary-foreground mb-6">
              <p className="text-sm font-medium opacity-90 mb-1 flex items-center gap-1">
                <Receipt className="w-4 h-4" /> Total Tagihan
              </p>
              <p className="text-4xl font-extrabold tracking-tight">
                Rp {cart.totalAmount.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Total Dibayar</span>
                <span className="font-bold text-lg text-foreground">Rp {totalPaid.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Sisa Tagihan</span>
                <span className={`font-bold text-lg ${remaining > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  Rp {remaining.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground font-medium">Kembalian</span>
                <span className="font-bold text-lg text-primary">
                  Rp {changeAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            
            <Button 
              className="w-full mt-8 h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]" 
              size="lg" 
              onClick={handleSubmit} 
              disabled={isSubmitting || totalPaid < cart.totalAmount}
            >
              {isSubmitting ? "Memproses..." : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Selesaikan Pembayaran
                </>
              )}
            </Button>
          </div>

          {/* Payment Methods Panel - Right Side */}
          <div className="md:col-span-3 p-6 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-foreground">Metode Pembayaran</h4>
              <Button variant="outline" size="sm" onClick={handleAddPayment} className="border-primary/20 text-primary hover:bg-primary/10">
                <PlusCircle className="w-4 h-4 mr-1.5" /> Split Bill
              </Button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted flex-1 pb-4">
              {payments.map((p, index) => {
                const selectedMethod = paymentMethods.find(pm => pm.id === p.paymentMethodId);
                const isVoucher = selectedMethod?.type === "VOUCHER";
                const isTransferOrEDC = selectedMethod?.type === "TRANSFER" || selectedMethod?.type === "EDC" || selectedMethod?.type === "QRIS";

                return (
                  <div key={p.id} className="p-4 border border-border bg-card rounded-xl shadow-sm relative group transition-colors hover:border-primary/30">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 rounded-l-xl"></div>
                    
                    {payments.length > 1 && (
                      <button 
                        onClick={() => handleRemovePayment(p.id)}
                        className="absolute top-3 right-3 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    
                    <div className="grid gap-4 pl-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metode</Label>
                          <Select value={p.paymentMethodId} onValueChange={(val) => handleUpdatePayment(p.id, "paymentMethodId", val)}>
                            <SelectTrigger className="h-10 bg-background border-input focus:ring-primary/20">
                              <SelectValue placeholder="Pilih Metode" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentMethods.map(pm => (
                                <SelectItem key={pm.id} value={pm.id} className="py-2.5">
                                  {pm.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5 pr-8">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jumlah</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">Rp</span>
                            <Input 
                              type="number" 
                              min="0"
                              className="h-10 pl-8 font-bold text-foreground focus-visible:ring-primary/20"
                              value={p.amount} 
                              onChange={(e) => handleUpdatePayment(p.id, "amount", e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>

                      {isVoucher && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kode Voucher</Label>
                          <Input 
                            placeholder="cth. VCH-12345" 
                            className="h-10 bg-background focus-visible:ring-primary/20 uppercase"
                            value={p.voucherCode} 
                            onChange={(e) => handleUpdatePayment(p.id, "voucherCode", e.target.value)} 
                          />
                        </div>
                      )}

                      {isTransferOrEDC && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">No Referensi (Opsional)</Label>
                          <Input 
                            placeholder="cth. 938474" 
                            className="h-10 bg-background focus-visible:ring-primary/20"
                            value={p.referenceNumber} 
                            onChange={(e) => handleUpdatePayment(p.id, "referenceNumber", e.target.value)} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
