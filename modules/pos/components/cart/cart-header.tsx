"use client";

import { ShoppingCart } from "lucide-react";
import { usePosStoreSelector } from "../../stores/pos-store";

export function CartHeader() {
  const itemCount = usePosStoreSelector((state) =>
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  return (
    <div className="flex items-center gap-2 mb-4 shrink-0">
      <ShoppingCart className="w-5 h-5 text-primary" />
      <h3 className="text-lg font-bold text-foreground tracking-tight">Keranjang</h3>
      <div className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
        {itemCount} Item
      </div>
    </div>
  );
}
