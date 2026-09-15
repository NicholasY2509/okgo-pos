"use client";

import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { usePosStoreSelector, usePosStoreActions } from "../../stores/pos-store";

export function CartItems() {
  const items = usePosStoreSelector((state) => state.items);
  const appliedPromos = usePosStoreSelector((state) => state.appliedPromos);
  const { removeItem, updateQuantity } = usePosStoreActions();

  if (items.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="h-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
          <ShoppingCart className="w-12 h-12 mb-3 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Keranjang kosong</p>
          <p className="text-sm text-muted-foreground/80 mt-1">Pilih layanan atau paket di sebelah kiri</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
      {items.map((item) => {
        const applicablePromo = appliedPromos.find(
          p => p.rewardType === "PERCENTAGE_ITEM" && p.applicableProductIds?.includes(item.serviceId!)
        );
        let discountedPrice = null;
        if (applicablePromo && applicablePromo.rewardValue) {
           const discount = item.unitPrice * (applicablePromo.rewardValue / 100);
           discountedPrice = item.unitPrice - discount;
        }

        return (
        <div key={item.cartId} className="p-3 border shadow-sm border-border/60 rounded-xl bg-background hover:bg-card hover:border-border transition-colors group relative overflow-hidden flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 px-2">
              <h4 className="font-semibold text-base tracking-tight text-foreground leading-tight mb-1 line-clamp-2">{item.name}</h4>

              {item.type === "SERVICE" && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                  <span className="truncate max-w-[110px]">{item.staffName}</span>
                  <span className="w-1 h-1 rounded-full bg-border shrink-0"></span>
                  <span className="truncate max-w-[80px]">{item.roomName}</span>
                </div>
              )}

              {(item.type === "VOUCHER_PACKET" || item.isVoucherRedemption || applicablePromo) && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.type === "VOUCHER_PACKET" && (
                    <span className="inline-block text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                      Paket
                    </span>
                  )}
                  {item.isVoucherRedemption && (
                    <span className="inline-block text-[9px] font-semibold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                      Vch: {item.voucherCode}
                    </span>
                  )}
                  {applicablePromo && (
                    <span className="inline-block text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                      % {applicablePromo.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => removeItem(item.cartId)}
              className="text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-all shrink-0 -mt-1 -mr-1"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="flex justify-between items-end pl-2">
            {item.type !== "SERVICE" ? (
              <div className="flex items-center border border-border/80 rounded-md bg-muted/20 overflow-hidden h-7">
                <button
                  disabled={item.quantity <= 1}
                  onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                  className="px-2.5 hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-foreground/70 h-full flex items-center justify-center"
                >
                  <Minus size={12} strokeWidth={2.5} />
                </button>
                <span className="px-1 text-[13px] font-semibold text-foreground w-6 text-center h-full flex items-center justify-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                  className="px-2.5 hover:bg-muted transition-colors text-foreground/70 h-full flex items-center justify-center"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div /> // Spacer for flex-between
            )}

            <div className="flex flex-col items-end leading-none">
              {item.isVoucherRedemption ? (
                <>
                  <span className="text-[10px] line-through text-muted-foreground/60 mb-0.5">
                    Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                  </span>
                  <span className="font-light text-base tracking-tight text-green-600">Rp 0</span>
                </>
              ) : discountedPrice !== null ? (
                <>
                  <span className="text-[10px] line-through text-muted-foreground/60 mb-0.5">
                    Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                  </span>
                  <span className="font-light text-base tracking-tight text-primary">
                    Rp {(discountedPrice * item.quantity).toLocaleString('id-ID')}
                  </span>
                </>
              ) : (
                <span className="font-light text-base tracking-tight text-foreground">
                  Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
