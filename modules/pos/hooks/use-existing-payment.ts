import { useState, useEffect } from "react";
import { toast } from "sonner";
import { payExistingTransactionAction } from "../actions/pos-action";
import { getCustomerVouchersAction, getVoucherByCodeAction } from "../../vouchers/actions/get-customer-vouchers-action";

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
  const existingPaid = Number(transaction.paidAmount) || 0;

  const currentInputPaid = Number(payment.amount || 0);
  const totalPaid = existingPaid + currentInputPaid;
  const remaining = Math.max(0, totalAmount - totalPaid);
  const changeAmount = Math.max(0, totalPaid - totalAmount);

  const [ownedVouchers, setOwnedVouchers] = useState<any[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(transaction.customerId);

  useEffect(() => {
    if (selectedCustomerId) {
      setIsLoadingVouchers(true);
      getCustomerVouchersAction(selectedCustomerId).then(res => {
        if (res.success && res.data) {
          setOwnedVouchers(res.data);
        } else {
          setOwnedVouchers([]);
        }
        setIsLoadingVouchers(false);
      });
    } else {
      setOwnedVouchers([]);
    }
  }, [selectedCustomerId]);

  const handleUpdatePayment = (field: string, value: any) => {
    setPayment(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (isPartial = false) => {
    if (!isPartial && totalPaid < totalAmount) {
      toast.error("Jumlah bayar masih kurang.");
      return;
    }

    if (!payment.paymentMethodId) {
      toast.error("Pilih metode pembayaran.");
      return;
    }

    const pm = paymentMethods.find(x => x.id === payment.paymentMethodId);
    if (pm?.type !== "VOUCHER" && payment.amount <= 0) {
      toast.error("Jumlah pembayaran harus lebih dari 0.");
      return;
    }

    let res: any;

    if (pm?.type === "VOUCHER") {
      if (selectedVouchers.length === 0 && !payment.voucherCode) {
        toast.error("Pilih atau masukkan kode voucher.");
        return;
      }

      setIsSubmitting(true);
      const voucherCodes = selectedVouchers.length > 0 ? selectedVouchers.map(v => v.code) : [payment.voucherCode];

      const payload = {
        transactionId: transaction.id,
        payments: voucherCodes.map(code => ({
          paymentMethodId: payment.paymentMethodId,
          amount: 0,
          voucherCode: code,
          notes: payment.notes || undefined
        }))
      };

      res = await payExistingTransactionAction(payload);
    } else {
      setIsSubmitting(true);
      const payload = {
        transactionId: transaction.id,
        payments: [{
          paymentMethodId: payment.paymentMethodId,
          amount: Number(payment.amount),
          referenceNumber: payment.referenceNumber || undefined,
          notes: payment.notes || undefined
        }]
      };
      res = await payExistingTransactionAction(payload);
    }
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(isPartial ? "Pembayaran sebagian berhasil." : "Pembayaran berhasil diproses!");
      if (!isPartial) {
        onSuccess();
      } else {
        // Reset local payment state to allow next payment
        setPayment(prev => ({
          ...prev,
          amount: 0,
          voucherCode: "",
          referenceNumber: ""
        }));
        setSelectedVouchers([]);
      }
      routerRefresh();
    }
  };

  const [selectedVouchers, setSelectedVouchers] = useState<any[]>([]);

  const handleSelectVoucher = (voucher: any) => {
    setSelectedVouchers(prev => {
      // Toggle off if already selected
      if (prev.some(v => v.code === voucher.code)) {
        return prev.filter(v => v.code !== voucher.code);
      }

      const productId = voucher.voucherPacket?.productId;
      const isVisitVoucher = !!voucher.voucherPacket?.totalVisitCount;

      if (productId) {
        const matchingItems = (transaction.items || []).filter((item: any) => item.serviceId === productId);
        if (matchingItems.length === 0) {
          toast.error("Voucher ini tidak berlaku untuk layanan dalam transaksi ini.");
          return prev;
        }

        if (isVisitVoucher) {
          const totalQty = matchingItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
          const selectedSameProduct = prev.filter(v => v.voucherPacket?.productId === productId).length;
          if (selectedSameProduct >= totalQty) {
            toast.error(`Hanya ${totalQty} voucher yang dapat digunakan untuk layanan ini.`);
            return prev;
          }
        }
      } else {
        if (isVisitVoucher) {
           const totalQty = (transaction.items || []).reduce((acc: number, item: any) => acc + item.quantity, 0);
           const selectedGeneric = prev.filter(v => !v.voucherPacket?.productId).length;
           if (selectedGeneric >= totalQty) {
             toast.error(`Hanya ${totalQty} voucher yang dapat digunakan untuk transaksi ini.`);
             return prev;
           }
        }
      }

      return [...prev, voucher];
    });
  };

  const handleAddManualVoucher = async () => {
    if (!payment.voucherCode) return;
    
    // Check if already selected
    if (selectedVouchers.some(v => v.code === payment.voucherCode)) {
      toast.error("Voucher ini sudah dipilih.");
      handleUpdatePayment("voucherCode", "");
      return;
    }

    setIsSubmitting(true);
    const res = await getVoucherByCodeAction(payment.voucherCode);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      handleSelectVoucher(res.data);
      handleUpdatePayment("voucherCode", "");
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
    handleSubmit,
    handleSelectVoucher,
    handleAddManualVoucher,
    selectedVouchers,
    setSelectedVouchers,
    ownedVouchers,
    isLoadingVouchers,
    selectedCustomerId,
    setSelectedCustomerId
  };
}
