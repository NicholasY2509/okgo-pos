"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ticket, CheckCircle2, Loader2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CustomerSelector } from "../customer-selector";
import { usePosVoucherDialog } from "../../hooks/use-pos-voucher-dialog";

interface PosVoucherDialogProps {
  onRedeemVoucher: (voucher: any) => void;
}

export function PosVoucherDialog({ onRedeemVoucher }: PosVoucherDialogProps) {
  const {
    open,
    handleOpen,
    isLoading,
    code,
    setCode,
    customerId,
    setCustomerId,
    appliedVoucher,
    ownedVouchers,
    isLoadingVouchers,
    handleUseVoucher,
    handleApplyByCode,
    handleRemove
  } = usePosVoucherDialog(onRedeemVoucher);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between items-center bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary group">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            {appliedVoucher ? "Voucher Digunakan" : "Gunakan Voucher"}
          </div>
          {appliedVoucher ? (
            <Badge variant="default" className="text-xs bg-primary/20 text-primary hover:bg-primary/30 shadow-none border-none pointer-events-none">
              1 Dipilih
            </Badge>
          ) : (
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Pilih Voucher
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Gunakan Voucher
          </DialogTitle>
          <DialogDescription>
            Pilih pelanggan untuk melihat daftar voucher yang mereka miliki, atau masukkan kode voucher secara manual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {!appliedVoucher ? (
            <>
              {/* Customer Selector */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">Pelanggan</div>
                <CustomerSelector value={customerId} onChange={setCustomerId} />
              </div>

              {/* Manual Input */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">Redeem Manual</div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Kode Voucher (Contoh: VCH-1234)"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyByCode();
                      }
                    }}
                  />
                  <Button onClick={handleApplyByCode} disabled={isLoading || !code.trim()}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cek"}
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" /> Voucher Dimiliki ({ownedVouchers.length})
                  </div>
                </div>

                {!customerId ? (
                  <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center border border-dashed">
                    Pilih pelanggan di keranjang terlebih dahulu.
                  </div>
                ) : isLoadingVouchers ? (
                  <div className="flex justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : ownedVouchers.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center border border-dashed">
                    Pelanggan ini tidak memiliki voucher aktif.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
                    {ownedVouchers.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                        <div>
                          <p className="font-semibold text-sm">{v.voucherPacket?.name || 'Paket Voucher'}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{v.code}</p>
                          <p className="text-xs font-medium text-primary mt-1">
                            {v.voucherPacket?.productId
                              ? `Sisa ${v.remainingVisitCount ?? 0}x Kunjungan`
                              : `Sisa Rp ${Number(v.remainingCreditAmount ?? 0).toLocaleString('id-ID')}`
                            }
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-primary text-primary hover:bg-primary hover:text-white"
                          onClick={() => handleUseVoucher(v)}
                        >
                          Pakai
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl border-2 border-primary bg-primary/5">
              <div>
                <div className="font-semibold text-foreground flex items-center gap-2">
                  Voucher Valid
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div className="text-sm font-medium text-primary mt-2">
                  Potongan: -Rp {Number(appliedVoucher.remainingCreditAmount).toLocaleString('id-ID')}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleRemove} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                Hapus
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
