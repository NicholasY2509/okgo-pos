"use client";

import { useState } from "react";
import { Trash2, Plus, Minus, ShoppingCart, PlusCircle, Link2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePosStoreSelector, usePosStoreActions, type CartItem } from "../../stores/pos-store";
import { AddonServiceDialog } from "./addon-service-dialog";

interface CartItemsProps {
  products?: any[];
  staff?: any[];
  rooms?: any[];
  branchId?: string;
}

export function CartItems({ products = [], staff = [], rooms = [], branchId = "" }: CartItemsProps) {
  const items = usePosStoreSelector((state) => state.items);
  const appliedPromos = usePosStoreSelector((state) => state.appliedPromos);
  const isVipUpgrade = usePosStoreSelector((state) => state.isVipUpgrade);
  const { removeItem, updateQuantity, updateItem, addAddonServiceToItem } = usePosStoreActions();
  const [addonParentItem, setAddonParentItem] = useState<CartItem | null>(null);
  const availableRooms = rooms.filter((r) => (isVipUpgrade ? Boolean(r.isVip) : !r.isVip));

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

  const getDiscountedPrice = (item: CartItem) => {
    const applicablePromo = appliedPromos.find(
      (p) => p.rewardType === "PERCENTAGE_ITEM" && p.applicableProductIds?.includes(item.serviceId!)
    );
    if (applicablePromo && applicablePromo.rewardValue) {
      return item.unitPrice - item.unitPrice * (applicablePromo.rewardValue / 100);
    }
    return null;
  };

  // Group items sharing the same sessionGroupKey into a single cart card
  const displayEntries: { key: string; groupItems: CartItem[] }[] = [];
  const groupIndexMap = new Map<string, number>();

  for (const item of items) {
    if (item.sessionGroupKey) {
      const existingIdx = groupIndexMap.get(item.sessionGroupKey);
      if (existingIdx !== undefined) {
        displayEntries[existingIdx].groupItems.push(item);
      } else {
        groupIndexMap.set(item.sessionGroupKey, displayEntries.length);
        displayEntries.push({ key: item.sessionGroupKey, groupItems: [item] });
      }
    } else {
      displayEntries.push({ key: item.cartId, groupItems: [item] });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
      {displayEntries.map(({ key, groupItems }) => {
        if (groupItems.length > 1) {
          const firstItem = groupItems[0];
          const groupTotal = groupItems.reduce((sum, seg) => {
            if (seg.isVoucherRedemption) return sum;
            const dp = getDiscountedPrice(seg);
            return sum + (dp ?? seg.unitPrice) * seg.quantity;
          }, 0);

          return (
            <div
              key={key}
              className="p-3 border shadow-sm border-primary/40 rounded-xl bg-background hover:bg-card transition-colors flex flex-col gap-2"
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                    1 Sesi · {groupItems.length} Layanan
                  </span>
                  {groupItems.some((g) => g.isVip) && (
                    <span className="inline-block text-[9px] font-semibold bg-amber-500/15 text-amber-600 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                      VIP
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                    {firstItem.roomName}
                  </span>
                </div>
              </div>

              <div>
                {groupItems.map((seg, segIdx) => {
                  const discountedPrice = getDiscountedPrice(seg);
                  const effectivePrice = seg.isVoucherRedemption
                    ? 0
                    : (discountedPrice ?? seg.unitPrice) * seg.quantity;

                  return (
                    <div key={seg.cartId}>
                      {segIdx > 0 && (
                        <div className="flex items-center px-1 my-0.5">
                          <div className="flex-1 border-t border-border/50" />
                          <Link2 className="w-3 h-3 mx-2 text-primary/70 shrink-0" />
                          <div className="flex-1 border-t border-border/50" />
                        </div>
                      )}
                      <div className="py-1.5 px-1 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-foreground leading-tight truncate">
                            {segIdx + 1}. {seg.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {seg.staffName}{seg.roomName ? ` · ${seg.roomName}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-normal text-foreground">
                            Rp {effectivePrice.toLocaleString("id-ID")}
                          </span>
                          <button
                            onClick={() => removeItem(seg.cartId)}
                            className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 p-1 rounded-md transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 px-1">
                {products.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setAddonParentItem(firstItem)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 hover:bg-primary/5 px-2 py-1 rounded-md transition-colors -ml-1"
                  >
                    <PlusCircle size={12} />
                    Lanjut Servis
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground">Total Sesi</span>
                )}
                <div className="flex flex-col items-end leading-none">
                  <span className="font-semibold text-base tracking-tight text-foreground">
                    Rp {groupTotal.toLocaleString("id-ID")}
                  </span>
                  {groupItems.some((g) => g.isVip) && (
                    <span className="text-[10px] font-medium text-amber-600 mt-0.5">
                      + Rp 80.000 VIP
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        }

        const item = groupItems[0];
        const applicablePromo = appliedPromos.find(
          (p) => p.rewardType === "PERCENTAGE_ITEM" && p.applicableProductIds?.includes(item.serviceId!)
        );
        const discountedPrice = getDiscountedPrice(item);

        return (
          <div
            key={item.cartId}
            className="p-3 border shadow-sm border-border/60 rounded-xl bg-background hover:bg-card hover:border-border transition-colors group relative overflow-hidden flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 px-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <h4 className="font-semibold text-base tracking-tight text-foreground leading-tight line-clamp-2">
                    {item.name}
                  </h4>
                  {item.isVip && (
                    <span className="inline-block text-[9px] font-semibold bg-amber-500/15 text-amber-600 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider shrink-0">
                      VIP
                    </span>
                  )}
                </div>

                {item.type === "SERVICE" && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                    <span className="truncate max-w-[110px]">{item.staffName}</span>
                    <span className="w-1 h-1 rounded-full bg-border shrink-0"></span>
                    {item.roomId ? (
                      <span className="truncate max-w-[80px]">{item.roomName}</span>
                    ) : (
                      <Select
                        value=""
                        onValueChange={(val) => {
                          const r = rooms.find((rm) => rm.id === val);
                          updateItem(item.cartId, { roomId: val, roomName: r?.name });
                        }}
                      >
                        <SelectTrigger className="h-6 text-[11px] w-[125px] border-amber-500/60 text-amber-600">
                          <SelectValue placeholder={isVipUpgrade ? "Pilih Room VIP" : "Pilih Ruangan"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRooms.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name} {r.isVip ? "(VIP)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
              ) : products.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setAddonParentItem(item)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 hover:bg-primary/5 px-2 py-1 rounded-md transition-colors"
                >
                  <PlusCircle size={12} />
                  Lanjut Servis
                </button>
              ) : (
                <div />
              )}

              <div className="flex flex-col items-end leading-none">
                {item.isVoucherRedemption ? (
                  <>
                    <span className="text-[10px] line-through text-muted-foreground/60 mb-0.5">
                      Rp {(item.unitPrice * item.quantity).toLocaleString("id-ID")}
                    </span>
                    <span className="font-light text-base tracking-tight text-green-600">Rp 0</span>
                  </>
                ) : discountedPrice !== null ? (
                  <>
                    <span className="text-[10px] line-through text-muted-foreground/60 mb-0.5">
                      Rp {(item.unitPrice * item.quantity).toLocaleString("id-ID")}
                    </span>
                    <span className="font-light text-base tracking-tight text-primary">
                      Rp {(discountedPrice * item.quantity).toLocaleString("id-ID")}
                    </span>
                  </>
                ) : (
                  <span className="font-light text-base tracking-tight text-foreground">
                    Rp {(item.unitPrice * item.quantity).toLocaleString("id-ID")}
                  </span>
                )}
                {item.isVip && (
                  <span className="text-[10px] font-medium text-amber-600 mt-0.5">
                    + Rp 80.000 VIP
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <AddonServiceDialog
        parentItem={addonParentItem}
        onClose={() => setAddonParentItem(null)}
        products={products}
        staff={staff}
        rooms={rooms}
        branchId={branchId}
        onConfirm={(addon) => {
          if (!addonParentItem) return;
          addAddonServiceToItem(addonParentItem.cartId, {
            type: "SERVICE",
            serviceId: addon.serviceId,
            name: addon.name,
            unitPrice: addon.unitPrice,
            quantity: 1,
            staffId: addon.staffId,
            staffName: addon.staffName,
            roomId: addon.roomId,
            roomName: addon.roomName,
            discountAmount: 0,
          });
        }}
      />
    </div>
  );
}
