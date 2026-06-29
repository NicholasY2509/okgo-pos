import { useState } from "react";
import { toast } from "sonner";
import { payExistingTransactionAction } from "../actions/pos-action";

export function useExistingPayment(transaction: any, paymentMethods: any[], onSuccess: () => void, routerRefresh: () => void) {
  const [payment, setPayment] = useState({
    paymentMethodId: "",
    amount: transaction.totalAmount || 0,
    referenceNumber: "",
    voucherCode: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = transaction.totalAmount || 0;
  const subtotal = transaction.subtotal || 0;
  const discountTotal = transaction.discountTotal || 0;
  
  const totalPaid = Number(payment.amount || 0);
  const remaining = Math.max(0, totalAmount - totalPaid);
  const changeAmount = Math.max(0, totalPaid - totalAmount);

  const handleUpdatePayment = (field: string, value: any) => {
    setPayment(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (totalPaid < totalAmount) {
      toast.error("Jumlah bayar masih kurang.");
      return;
    }

    if (!payment.paymentMethodId) {
      toast.error("Pilih metode pembayaran.");
      return;
    }

    if (payment.amount <= 0) {
      toast.error("Jumlah pembayaran harus lebih dari 0.");
      return;
    }

    const pm = paymentMethods.find(x => x.id === payment.paymentMethodId);
    if (pm?.type === "VOUCHER" && !payment.voucherCode) {
      toast.error("Kode voucher wajib diisi untuk pembayaran dengan voucher.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      transactionId: transaction.id,
      payments: [{
        paymentMethodId: payment.paymentMethodId,
        amount: Number(payment.amount),
        referenceNumber: payment.referenceNumber || undefined,
        voucherCode: payment.voucherCode || undefined,
        notes: payment.notes || undefined
      }]
    };

    const res = await payExistingTransactionAction(payload);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Pembayaran berhasil diproses!");
      onSuccess();
      routerRefresh();
    }
  };

  return {
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
  };
}
