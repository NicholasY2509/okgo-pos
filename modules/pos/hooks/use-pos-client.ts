import { useState, useEffect } from "react";
import { toast } from "sonner";
import { usePosStoreActions, usePosStoreSelector } from "../stores/pos-store";

import { createDirectRedemptionAction } from "../actions/pos-action";

interface UsePosClientProps {
  staff: any[];
  rooms: any[];
  activeDiscount: number;
  branchId: string;
}

export function usePosClient({ staff, rooms, activeDiscount, branchId }: UsePosClientProps) {
  const { addItem, updateItemDiscount, clearCart, setCustomerId } = usePosStoreActions();
  const cartItems = usePosStoreSelector((state) => state.items);
  const cartCustomerId = usePosStoreSelector((state) => state.customerId);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedVoucherRedemption, setSelectedVoucherRedemption] = useState<any | null>(null);

  // Auto-recalculate discounts for items already in the cart
  useEffect(() => {
    cartItems.forEach(item => {
      if (item.type === "SERVICE" && !item.isVoucherRedemption) {
        const correctDiscount = activeDiscount > 0 ? (item.unitPrice * activeDiscount) / 100 : 0;
        if (item.discountAmount !== correctDiscount) {
          updateItemDiscount(item.cartId, correctDiscount);
        }
      }
    });
  }, [activeDiscount, cartItems, updateItemDiscount]);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
  };

  const handleRedeemVoucherClick = (customerVoucher: any) => {
    const isAlreadyInCart = cartItems.some(item => item.customerVoucherId === customerVoucher.id);
    if (isAlreadyInCart) {
      toast.error("Voucher ini sudah ditambahkan ke keranjang.");
      return;
    }

    if (customerVoucher?.voucherPacket?.product) {
      setSelectedProduct(customerVoucher.voucherPacket.product);
      setSelectedVoucherRedemption(customerVoucher);
    } else {
      toast.error("Voucher ini tidak memiliki layanan yang terkait.");
    }
  };

  const handleAddServiceToCart = async (staffId: string, roomId: string) => {
    if (!selectedProduct || !staffId || !roomId) return;

    const staffMember = staff.find(s => s.id === staffId);
    const room = rooms.find(r => r.id === roomId);
    const unitPrice = Number(selectedProduct.price);

    if (selectedVoucherRedemption) {
      // Direct redemption
      const res = await createDirectRedemptionAction({
        branchId,
        customerVoucherId: selectedVoucherRedemption.id,
        roomId,
        staffId
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Voucher berhasil ditukarkan dan sesi dimulai!");
      }
      setSelectedVoucherRedemption(null);
    } else {
      const discountAmount = activeDiscount > 0 ? (unitPrice * activeDiscount) / 100 : 0;
      addItem({
        type: "SERVICE",
        serviceId: selectedProduct.id,
        quantity: 1, // Force to 1 as recommended
        staffId: staffId,
        roomId: roomId,
        discountAmount: discountAmount,
        name: selectedProduct.name,
        unitPrice: unitPrice,
        staffName: staffMember?.firstName + " " + (staffMember?.lastName || ""),
        roomName: room?.name,
      });
    }

    setSelectedProduct(null);
  };

  const handleVoucherPacketClick = (packet: any) => {
    addItem({
      type: "VOUCHER_PACKET",
      voucherPacketId: packet.id,
      quantity: 1,
      discountAmount: 0,
      name: packet.name,
      unitPrice: Number(packet.price),
    });
  };

  return {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    selectedProduct,
    setSelectedProduct,
    selectedVoucherRedemption,
    setSelectedVoucherRedemption,
    handleProductClick,
    handleRedeemVoucherClick,
    handleAddServiceToCart,
    handleVoucherPacketClick,
    clearCart,
  };
}
