import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getCustomerVouchersAction, getVoucherByCodeAction } from "../../vouchers/actions/get-customer-vouchers-action";

export function useVoucherRedeemTab(onRedeemVoucher: (voucher: any) => void) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [serialNumber, setSerialNumber] = useState("");

  const [ownedVouchers, setOwnedVouchers] = useState<any[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [previewVoucher, setPreviewVoucher] = useState<any>(null);

  useEffect(() => {
    async function fetchVouchers() {
      if (!selectedCustomerId) {
        setOwnedVouchers([]);
        return;
      }
      setIsLoadingVouchers(true);
      const result = await getCustomerVouchersAction(selectedCustomerId);
      if (result.success && result.data) {
        setOwnedVouchers(result.data);
      } else {
        toast.error("Gagal mengambil data voucher pelanggan.");
      }
      setIsLoadingVouchers(false);
    }
    fetchVouchers();
  }, [selectedCustomerId]);

  const handleSearch = async () => {
    if (!serialNumber) {
      toast.error("Masukkan kode voucher terlebih dahulu");
      return;
    }

    setIsRedeeming(true);
    const result = await getVoucherByCodeAction(serialNumber);
    setIsRedeeming(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.data) {
      setPreviewVoucher(result.data);
    }
  };

  const confirmRedeem = (voucher: any) => {
    onRedeemVoucher(voucher);
    setPreviewVoucher(null);
    setSerialNumber("");
  };

  return {
    selectedCustomerId,
    setSelectedCustomerId,
    serialNumber,
    setSerialNumber,
    ownedVouchers,
    isLoadingVouchers,
    isRedeeming,
    previewVoucher,
    setPreviewVoucher,
    handleSearch,
    confirmRedeem
  };
}
