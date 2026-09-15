"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgePercent, Tag, CheckCircle2 } from "lucide-react";
import { usePosCart } from "../../stores/pos-store";
import { getEligiblePromotionsAction } from "../../../discount/actions/promotion-action";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PosPromoDialogProps {
  branchId: string;
  disabled?: boolean;
}

export function PosPromoDialog({ branchId, disabled }: PosPromoDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eligiblePromos, setEligiblePromos] = useState<any[]>([]);
  const { items, appliedPromos, togglePromo } = usePosCart();

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setIsLoading(true);
      try {
        const result = await getEligiblePromotionsAction(items, branchId);
        if (result.success && result.data) {
          setEligiblePromos(result.data);
        } else {
          toast.error("Gagal memuat promo");
        }
      } catch (error) {
        console.error("Failed to load promos:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggle = (promo: any) => {
    togglePromo({
      promoId: promo.promoId,
      name: promo.name,
      discountAmount: promo.potentialDiscountValue,
      rewardType: promo.rewardType,
      applicableProductIds: promo.applicableProductIds,
      rewardValue: promo.rewardValue
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between items-center bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary group" disabled={disabled}>
          <div className="flex items-center gap-2">
            <BadgePercent className="w-4 h-4" />
            {appliedPromos.length > 0 ? `${appliedPromos.length} Promo Digunakan` : "Gunakan Promo"}
          </div>
          {appliedPromos.length > 0 ? (
            <Badge variant="default" className="text-xs bg-primary/20 text-primary hover:bg-primary/30 shadow-none border-none pointer-events-none">
              {appliedPromos.length} Dipilih
            </Badge>
          ) : (
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Pilih Promo
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgePercent className="w-5 h-5 text-primary" />
            Promo & Diskon Tersedia
          </DialogTitle>
          <DialogDescription>
            Pilih promo yang memenuhi syarat untuk keranjang ini. (Bisa pilih lebih dari satu)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground animate-pulse">
              Mencari promo yang tersedia...
            </div>
          ) : eligiblePromos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Tidak ada promo yang memenuhi syarat saat ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {eligiblePromos.map((promo) => {
                const isSelected = appliedPromos.some(p => p.promoId === promo.promoId);
                const isEligible = promo.isEligible !== false;

                return (
                  <div
                    key={promo.promoId}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm ${isSelected ? "border-primary bg-primary/5" :
                      !isEligible ? "border-border/40 opacity-60 bg-muted/30" :
                        "border-border/60 hover:border-primary/40 bg-card"
                      }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                        {promo.name}
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                        {!isEligible && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-medium whitespace-nowrap shrink-0">Tidak Berlaku</Badge>
                        )}
                      </div>

                      {isEligible && promo.potentialDiscountValue > 0 ? (
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-sm font-bold text-primary">-Rp {promo.potentialDiscountValue.toLocaleString('id-ID')}</span>
                          {promo.rewardValue && promo.rewardType.includes("PERCENTAGE") && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 font-bold bg-primary/5 text-primary border-primary/20">
                              {promo.rewardValue}%
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                            {promo.rewardType === "PERCENTAGE_TOTAL" ? "Keranjang" : promo.rewardType === "PERCENTAGE_ITEM" ? "Item Spesifik" : "Layanan Tambahan"}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {promo.rewardType === "PERCENTAGE_TOTAL" ? "Diskon Total Keranjang" :
                            promo.rewardType === "FREE_ADDON" ? "Gratis Layanan Tambahan" : "Diskon Item Spesifik"}
                        </div>
                      )}

                      {!isEligible && promo.ineligibilityReason && (
                        <div className="text-[10px] text-destructive mt-1 leading-tight">
                          {promo.ineligibilityReason}
                        </div>
                      )}
                    </div>
                    {isSelected ? (
                      <Button variant="outline" size="sm" onClick={() => handleToggle(promo)} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 h-8 text-xs shrink-0 px-3">
                        Batal
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" onClick={() => handleToggle(promo)} disabled={!isEligible} className="h-8 text-xs shrink-0 px-3">
                        Pilih
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
