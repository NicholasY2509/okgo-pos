"use client";

import { usePosCart } from "../../stores/pos-store";

export function CartSummary() {
  const { subtotal, discountTotal, totalAmount, voucherNominalDiscount, amountDue } = usePosCart();

  return (
    <div className="space-y-1.5 mb-3">
      {/* <div className="flex justify-between text-sm font-medium">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="text-foreground">Rp {subtotal.toLocaleString('id-ID')}</span>
      </div> */}
      {discountTotal > 0 && (
        <div className="flex justify-between text-sm font-medium text-primary bg-primary/5 p-1.5 rounded-md px-2 -mx-2">
          <span>Promo / Diskon Item</span>
          <span>- Rp {discountTotal.toLocaleString('id-ID')}</span>
        </div>
      )}

      {voucherNominalDiscount > 0 ? (
        <>
          <div className="flex justify-between items-end pt-2 border-t border-border mt-2">
            <span className="text-foreground font-semibold">Total Transaksi</span>
            <span className="font-bold">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between text-sm font-medium text-emerald-600 bg-emerald-50 p-1.5 rounded-md px-2 -mx-2 mt-1">
            <span>Voucher Dipakai</span>
            <span>- Rp {voucherNominalDiscount.toLocaleString('id-ID')}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
