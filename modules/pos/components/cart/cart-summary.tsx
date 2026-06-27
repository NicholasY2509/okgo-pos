"use client";

import { usePosStoreSelector } from "../../stores/pos-store";

export function CartSummary() {
  const subtotal = usePosStoreSelector((state) =>
    state.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
  );

  const discountTotal = usePosStoreSelector((state) =>
    state.items.reduce((acc, item) => acc + item.discountAmount, 0)
  );

  const totalAmount = subtotal - discountTotal;

  return (
    <div className="space-y-1.5 mb-3">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="text-foreground">Rp {subtotal.toLocaleString('id-ID')}</span>
      </div>
      {discountTotal > 0 && (
        <div className="flex justify-between text-sm font-medium text-primary bg-primary/5 p-1.5 rounded-md px-2 -mx-2">
          <span>Diskon</span>
          <span>- Rp {discountTotal.toLocaleString('id-ID')}</span>
        </div>
      )}
      <div className="flex justify-between items-end pt-2 border-t border-border">
        <span className="text-foreground font-bold">Total Pembayaran</span>
        <span className="text-xl font-extrabold text-primary">
          Rp {totalAmount.toLocaleString('id-ID')}
        </span>
      </div>
    </div>
  );
}
