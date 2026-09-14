import { useState, useEffect } from "react";
import { toast } from "sonner";
import { usePosCart, usePosStoreActions } from "../stores/pos-store";
import { getVoucherByCodeAction, getCustomerVouchersAction } from "../../vouchers/actions/get-customer-vouchers-action";

export function usePosVoucherDialog(onRedeemVoucher: (voucher: any) => void) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState("");
  const { customerId, appliedVoucher, applyVoucher, removeVoucher, items: cartItems, updateItem } = usePosCart();
  const { setCustomerId } = usePosStoreActions();

  const [ownedVouchers, setOwnedVouchers] = useState<any[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);

  useEffect(() => {
    async function fetchVouchers() {
      if (!customerId) {
        setOwnedVouchers([]);
        return;
      }
      setIsLoadingVouchers(true);
      const result = await getCustomerVouchersAction(customerId);
      if (result.success && result.data) {
        setOwnedVouchers(result.data);
      } else {
        toast.error("Gagal mengambil data voucher pelanggan.");
      }
      setIsLoadingVouchers(false);
    }

    if (open) {
      fetchVouchers();
    }
  }, [customerId, open]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setCode("");
    }
  };

  const handleUseVoucher = (voucher: any) => {
    // Verify ownership
    if (voucher.customerId && voucher.customerId !== customerId) {
      toast.error("Voucher ini bukan milik pelanggan yang dipilih.");
      return;
    }

    const isServiceVoucher = !!voucher.voucherPacket?.productId;

    if (isServiceVoucher) {
      const timesApplied = cartItems.filter(item => item.customerVoucherId === voucher.id).length;

      if (voucher.remainingVisitCount != null && voucher.remainingVisitCount > timesApplied) {
        const matchingItem = cartItems.find(item => item.serviceId === voucher.voucherPacket.productId && !item.isVoucherRedemption);
        if (matchingItem) {
          updateItem(matchingItem.cartId, {
            discountAmount: matchingItem.unitPrice,
            isVoucherRedemption: true,
            customerVoucherId: voucher.id,
            voucherCode: voucher.code
          });
          toast.success("Voucher layanan berhasil diterapkan!");
          setOpen(false);
        } else {
          toast.error("Layanan untuk voucher ini tidak ada di keranjang atau sudah menggunakan voucher.");
        }
      } else {
        toast.error("Kuota kunjungan voucher ini sudah habis.");
      }
    } else {
      if (voucher.remainingCreditAmount != null && Number(voucher.remainingCreditAmount) > 0) {
        // Nominal voucher -> apply to cart store directly
        applyVoucher(voucher);
        toast.success(`Voucher nominal berhasil digunakan!`);
        setOpen(false);
      } else {
        toast.error("Saldo voucher nominal ini sudah habis.");
      }
    }
  };

  const handleApplyByCode = async () => {
    if (!code.trim()) {
      toast.error("Masukkan kode voucher terlebih dahulu");
      return;
    }

    if (!customerId) {
      toast.error("Pilih pelanggan terlebih dahulu untuk menggunakan voucher.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await getVoucherByCodeAction(code.trim());
      if (result.success && result.data) {
        handleUseVoucher(result.data);
      } else {
        toast.error(result.error || "Gagal memuat voucher");
      }
    } catch (error) {
      console.error("Failed to load voucher:", error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    removeVoucher();
    toast.info("Voucher telah dihapus.");
    setOpen(false);
  };

  const filteredOwnedVouchers = ownedVouchers.filter(v => {
    if (!v.voucherPacket?.productId) return true;

    const eligibleItems = cartItems.filter(item => item.serviceId === v.voucherPacket.productId && !item.isVoucherRedemption);
    const timesApplied = cartItems.filter(item => item.customerVoucherId === v.id).length;

    return eligibleItems.length > 0 && (v.remainingVisitCount == null || v.remainingVisitCount > timesApplied);
  });

  return {
    open,
    handleOpen,
    isLoading,
    code,
    setCode,
    customerId,
    setCustomerId,
    appliedVoucher,
    ownedVouchers: filteredOwnedVouchers,
    isLoadingVouchers,
    handleUseVoucher,
    handleApplyByCode,
    handleRemove
  };
}
