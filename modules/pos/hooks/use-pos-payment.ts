import { useState } from "react";
import { toast } from "sonner";
import { createPosTransactionAction } from "../actions/pos-action";

export function usePosPayment(cart: any, branchId: string, paymentMethods: any[], onSuccess: () => void) {
  const [payment, setPayment] = useState({
    paymentMethodId: "",
    amount: cart.totalAmount,
    referenceNumber: "",
    voucherCode: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPaid = Number(payment.amount || 0);
  const remaining = Math.max(0, cart.totalAmount - totalPaid);
  const changeAmount = Math.max(0, totalPaid - cart.totalAmount);
  const isZeroTotal = cart.totalAmount === 0;

  const handleUpdatePayment = (field: string, value: any) => {
    setPayment(prev => ({ ...prev, [field]: value }));
  };

  const hasVoucherPacket = cart.items?.some((i: any) => i.type === "VOUCHER_PACKET");

  const handleSubmit = async (isPayLater: boolean = false) => {
    if (isPayLater) {
      if (hasVoucherPacket) {
        toast.error("Pembelian paket voucher tidak dapat menggunakan fitur Bayar Nanti.");
        return;
      }
    } else if (!isZeroTotal) {
      if (totalPaid < cart.totalAmount) {
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
    }

    setIsSubmitting(true);

    const payload = {
      branchId,
      customerId: cart.customerId,
      items: cart.items.map((i: any) => ({
        type: i.type,
        serviceId: i.type === "SERVICE" ? i.serviceId : undefined,
        voucherPacketId: i.type === "VOUCHER_PACKET" ? i.voucherPacketId : undefined,
        quantity: i.quantity,
        staffId: i.staffId,
        roomId: i.roomId,
        discountAmount: i.discountAmount,
        isVoucherRedemption: i.isVoucherRedemption,
        customerVoucherId: i.customerVoucherId,
        voucherCode: i.voucherCode
      })),
      payments: (isZeroTotal || isPayLater) ? [] : [{
        paymentMethodId: payment.paymentMethodId,
        amount: Number(payment.amount),
        referenceNumber: payment.referenceNumber || undefined,
        voucherCode: payment.voucherCode || undefined,
        notes: payment.notes || undefined
      }],
      isPayLater
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

  return {
    payment,
    isSubmitting,
    totalPaid,
    remaining,
    changeAmount,
    isZeroTotal,
    hasVoucherPacket,
    handleUpdatePayment,
    handleSubmit
  };
}
