"use client";

import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosCart, usePosStoreSelector } from "../../stores/pos-store";

interface CartCheckoutProps {
  onCheckout: () => void;
}

export function CartCheckout({ onCheckout }: CartCheckoutProps) {
  const items = usePosStoreSelector((state) => state.items);
  const hasItems = items.length > 0;
  const hasUnassignedRoom = items.some((i) => i.type === "SERVICE" && !i.roomId);
  const { amountDue } = usePosCart();

  return (
    <Button
      className="w-full bg-primary text-primary-foreground py-6 text-base font-bold hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex justify-between items-center px-5 mt-2"
      onClick={onCheckout}
      disabled={!hasItems || hasUnassignedRoom}
    >
      <div className="flex items-center gap-2">
        <span>Proses</span>
      </div>
      <div className="text-2xl tracking-tight">
        Rp {amountDue.toLocaleString('id-ID')}
      </div>
    </Button>
  );
}
