"use client";

import { CartHeader } from "./cart/cart-header";
import { CartCustomer } from "./cart/cart-customer";
import { CartItems } from "./cart/cart-items";
import { CartSummary } from "./cart/cart-summary";
import { CartCheckout } from "./cart/cart-checkout";

interface PosCartProps {
  onCheckout: () => void;
}

export function PosCart({ onCheckout }: PosCartProps) {
  return (
    <div className="flex-1 bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>

      <CartHeader />
      <div className="mb-2">
        <CartCustomer />
      </div>
      <CartItems />

      <div className="border-t border-border pt-3 mt-2 bg-card relative z-10 shrink-0">
        <CartSummary />
        <CartCheckout onCheckout={onCheckout} />
      </div>
    </div>
  );
}

