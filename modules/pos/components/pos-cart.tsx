"use client";

import { CartHeader } from "./cart/cart-header";
import { CartCustomer } from "./cart/cart-customer";
import { CartItems } from "./cart/cart-items";
import { CartSummary } from "./cart/cart-summary";
import { CartCheckout } from "./cart/cart-checkout";

import { PosPromoDialog } from "./cart/pos-promo-dialog";
import { PosVoucherDialog } from "./cart/pos-voucher-dialog";
import { usePosCart, usePosStoreSelector } from "../stores/pos-store";
import { useEffect } from "react";

interface PosCartProps {
  onCheckout: () => void;
  branchId: string;
  onRedeemVoucher: (voucher: any) => void;
  products?: any[];
  staff?: any[];
  rooms?: any[];
}

export function PosCart({ onCheckout, branchId, onRedeemVoucher, products = [], staff = [], rooms = [] }: PosCartProps) {
  const { isVipUpgrade, setIsVipUpgrade, appliedPromos, clearPromos, appliedVoucher } = usePosCart();
  const cartItems = usePosStoreSelector((state) => state.items);
  const hasVoucherPacket = cartItems.some(i => i.type === "VOUCHER_PACKET");
  const hasAppliedVoucher = !!appliedVoucher || cartItems.some(i => i.isVoucherRedemption);
  const hasAppliedPromo = appliedPromos.length > 0;

  useEffect(() => {
    if (hasVoucherPacket) {
      if (isVipUpgrade) setIsVipUpgrade(false);
      if (appliedPromos.length > 0) clearPromos();
    }
  }, [hasVoucherPacket, isVipUpgrade, appliedPromos.length, setIsVipUpgrade, clearPromos]);

  return (
    <div className="flex-1 bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col h-full relative overflow-hidden">
      <CartHeader />
      <div className="mb-2">
        <CartCustomer />
      </div>
      <CartItems products={products} staff={staff} rooms={rooms} branchId={branchId} />

      <div className="border-t border-border pt-3 mt-2 bg-card relative z-10 shrink-0 space-y-3">
        <div className="flex flex-col gap-1">
          <PosPromoDialog branchId={branchId} disabled={hasVoucherPacket || hasAppliedVoucher} />
          <PosVoucherDialog onRedeemVoucher={onRedeemVoucher} disabled={hasVoucherPacket || hasAppliedPromo} />
        </div>
        <CartSummary />
        <CartCheckout onCheckout={onCheckout} />
      </div>
    </div>
  );
}
