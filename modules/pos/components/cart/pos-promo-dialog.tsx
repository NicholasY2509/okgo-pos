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
}

export function PosPromoDialog({ branchId }: PosPromoDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eligiblePromos, setEligiblePromos] = useState<any[]>([]);
  const { items, appliedPromo, applyPromo, removePromo } = usePosCart();

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

  const handleApply = (promo: any) => {
    applyPromo({
      promoId: promo.promoId,
      name: promo.name,
      discountAmount: promo.potentialDiscountValue,
      rewardType: promo.rewardType,
    });
    toast.success(`Promo "${promo.name}" berhasil digunakan!`);
    setOpen(false);
  };

  const handleRemove = () => {
    removePromo();
    toast.info("Promo telah dihapus.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between items-center bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary group">
          <div className="flex items-center gap-2">
            <BadgePercent className="w-4 h-4" />
            {appliedPromo ? "Promo Digunakan" : "Gunakan Promo"}
          </div>
          {appliedPromo ? (
            <Badge variant="default" className="text-xs bg-primary/20 text-primary hover:bg-primary/30 shadow-none border-none pointer-events-none">
              1 Dipilih
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
            Pilih satu promo yang memenuhi syarat untuk keranjang ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
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
            <div className="space-y-3">
              {eligiblePromos.map((promo) => {
                const isSelected = appliedPromo?.promoId === promo.promoId;
                return (
                  <div 
                    key={promo.promoId} 
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {promo.name}
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {promo.rewardType === "PERCENTAGE_TOTAL" ? "Diskon Total Keranjang" : 
                         promo.rewardType === "FREE_ADDON" ? "Gratis Layanan Tambahan" : "Diskon Item"}
                      </div>
                      {promo.potentialDiscountValue > 0 && (
                        <div className="text-sm font-medium text-primary mt-2">
                          Potongan: -Rp {promo.potentialDiscountValue.toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                    {isSelected ? (
                      <Button variant="outline" size="sm" onClick={handleRemove} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                        Hapus
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" onClick={() => handleApply(promo)}>
                        Gunakan
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
