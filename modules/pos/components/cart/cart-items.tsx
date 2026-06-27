"use client";

import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { usePosStoreSelector, usePosStoreActions } from "../../stores/pos-store";

export function CartItems() {
  const items = usePosStoreSelector((state) => state.items);
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
      {items.map((item) => (
        <div key={item.cartId} className="p-3 border border-border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          {/* Type indicator bar */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'VOUCHER_PACKET' ? 'bg-primary/60' : item.isVoucherRedemption ? 'bg-green-500' : 'bg-primary'}`}></div>

          <div className="flex justify-between items-start mb-2 pl-2">
            <div className="pr-4">
              <h4 className="font-semibold text-sm text-foreground leading-tight">{item.name}</h4>
              {item.type === "SERVICE" && (
                <div className="flex flex-col gap-0.5 mt-1">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="font-medium text-foreground">Terapis:</span> {item.staffName}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="font-medium text-foreground">Ruang:</span> {item.roomName}
                  </p>
                </div>
              )}
              {item.type === "VOUCHER_PACKET" && (
                <span className="inline-block mt-1.5 text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm tracking-wide uppercase">
                  Voucher
                </span>
              )}
              {item.isVoucherRedemption && (
                <span className="inline-block mt-1.5 text-[10px] font-bold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-sm tracking-wide uppercase">
                  Voucher: {item.voucherCode}
                </span>
              )}
            </div>
            <button
              onClick={() => removeItem(item.cartId)}
              className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex justify-between items-end pl-2">
            <div className="flex items-center border border-border rounded-md bg-muted/50 shadow-sm overflow-hidden scale-90 origin-left">
              <button
                disabled={item.quantity <= 1 || item.type === "SERVICE"}
                onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                className="p-1.5 hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-foreground/70"
              >
                <Minus size={14} />
              </button>
              <span className="px-3 text-sm font-bold text-foreground w-8 text-center bg-background py-1">
                {item.quantity}
              </span>
              <button
                disabled={item.type === "SERVICE"}
                onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                className="p-1.5 hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-foreground/70"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="font-bold text-primary flex flex-col items-end">
              {item.isVoucherRedemption ? (
                <>
                  <span className="text-xs line-through text-muted-foreground opacity-70">
                    Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                  </span>
                  <span className="text-green-600">Rp 0</span>
                </>
              ) : (
                <>Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}</>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
