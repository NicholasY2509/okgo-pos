import { useState } from "react";
import { toast } from "sonner";
import { createPosTransactionAction } from "../actions/pos-action";
import { io } from "socket.io-client";

export function usePosPayment(cart: any, branchId: string, paymentMethods: any[], onSuccess: () => void) {
  const [payment, setPayment] = useState({
    paymentMethodId: "",
    amount: cart.amountDue ?? cart.totalAmount,
    referenceNumber: "",
    voucherCode: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPaid = Number(payment.amount || 0);
  const remaining = Math.max(0, (cart.amountDue ?? cart.totalAmount) - totalPaid);
  const changeAmount = Math.max(0, totalPaid - (cart.amountDue ?? cart.totalAmount));
  const isZeroTotal = (cart.amountDue ?? cart.totalAmount) === 0;

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
      if (totalPaid < (cart.amountDue ?? cart.totalAmount)) {
        toast.error("Jumlah bayar masih kurang.");
        return;
      }

      if ((cart.amountDue ?? cart.totalAmount) > 0 && !payment.paymentMethodId) {
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

    const paymentsArray: any[] = [];

    // Auto-inject applied nominal voucher as payment
    if (cart.appliedVoucher && cart.appliedVoucher.remainingCreditAmount) {
      const voucherPm = paymentMethods.find(x => x.type === "VOUCHER");
      if (voucherPm) {
        paymentsArray.push({
          paymentMethodId: voucherPm.id,
          amount: cart.voucherNominalDiscount,
          voucherCode: cart.appliedVoucher.code
        });
      }
    }

    // Add user's selected payment if amountDue > 0
    if (!isZeroTotal && !isPayLater && payment.paymentMethodId && payment.amount > 0) {
      paymentsArray.push({
        paymentMethodId: payment.paymentMethodId,
        amount: Number(payment.amount),
        referenceNumber: payment.referenceNumber || undefined,
        voucherCode: payment.voucherCode || undefined,
        notes: payment.notes || undefined
      });
    }

    const payload = {
      branchId,
      customerId: cart.customerId,
      promotionIds: cart.appliedPromos?.map((p: any) => p.promoId) || [],
      loadedBookingId: cart.loadedBookingId,
      loadedTransactionId: cart.loadedTransactionId,
      isVipUpgrade: cart.isVipUpgrade,
      voucherNominalDiscount: cart.voucherNominalDiscount ?? 0,
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
      payments: isPayLater ? [] : paymentsArray,
      isPayLater
    };
    console.log("[PAYMENT CLIENT DEBUG] appliedPromos:", cart.appliedPromos, "promotionIds in payload:", payload.promotionIds);

    const res = await createPosTransactionAction(payload);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Transaksi berhasil disimpan!");

      // Notify kiosks
      const socket = io(process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined);
      cart.items.forEach((item: any) => {
        if (item.staffId) {
          socket.emit("service_assigned", {
            staffId: item.staffId,
            serviceName: item.name || "Layanan"
          });
        }
      });
      setTimeout(() => socket.disconnect(), 1000);

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
