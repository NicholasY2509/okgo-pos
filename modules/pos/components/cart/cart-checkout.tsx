"use client";

import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosStoreSelector } from "../../stores/pos-store";

interface CartCheckoutProps {
  onCheckout: () => void;
}

export function CartCheckout({ onCheckout }: CartCheckoutProps) {
  const hasItems = usePosStoreSelector((state) => state.items.length > 0);

  return (
    <Button
      className="w-full bg-primary text-primary-foreground py-4 text-base font-bold hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none gap-2"
      onClick={onCheckout}
      disabled={!hasItems}
    >
      <Receipt className="w-5 h-5" />
      Proses Pembayaran
    </Button>
  );
}
