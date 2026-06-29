"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { User, Search, Ticket, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useVoucherRedeemTab } from "../hooks/use-voucher-redeem-tab";
import { CustomerCombobox } from "../../customer/components/customer-combobox";

interface VoucherRedeemTabProps {
  customers: any[];
  onRedeemVoucher: (voucher: any) => void;
}

export function VoucherRedeemTab({ customers, onRedeemVoucher }: VoucherRedeemTabProps) {
  const {
    selectedCustomerId,
    setSelectedCustomerId,
    serialNumber,
    setSerialNumber,
    ownedVouchers,
    isLoadingVouchers,
    isRedeeming,
    previewVoucher,
    setPreviewVoucher,
    handleSearch,
    confirmRedeem
  } = useVoucherRedeemTab(onRedeemVoucher);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4 flex flex-col">
        <div>
          <Label className="text-sm font-semibold mb-2 block">Redeem Manual</Label>
          <p className="text-xs text-muted-foreground">
            Masukkan nomor seri voucher secara manual untuk melakukan redeem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Masukkan nomor seri..."
              className="pl-9"
              value={serialNumber}
              onChange={(e) => {
                setSerialNumber(e.target.value);
                if (previewVoucher) setPreviewVoucher(null);
              }}
            />
          </div>
          <Button onClick={handleSearch} disabled={isRedeeming || !serialNumber} className="font-semibold">
            {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cari"}
          </Button>
        </div>

        {/* Voucher Preview Card */}
        {previewVoucher && (
          <div className="mt-4 border border-border bg-card shadow-sm rounded-xl p-4 space-y-4">
            <div>
              <h3 className="font-bold text-lg">{previewVoucher.voucherPacket.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{previewVoucher.code}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-lg">
              <div>
                <p className="text-muted-foreground text-xs">Produk Berlaku</p>
                <p className="font-medium">{previewVoucher.voucherPacket.product?.name || "Semua Produk"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Sisa Kuota / Nilai</p>
                <p className="font-medium">{previewVoucher.remainingCreditAmount ?? "1"}x</p>
              </div>
              {previewVoucher.expiresAt && (
                <div className="col-span-2 pt-2 border-t border-border/50">
                  <p className="text-muted-foreground text-xs">Berlaku Hingga</p>
                  <p className="font-medium">{format(new Date(previewVoucher.expiresAt), "dd MMMM yyyy", { locale: id })}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPreviewVoucher(null)}>
                Batal
              </Button>
              <Button className="flex-1 font-bold" onClick={() => confirmRedeem(previewVoucher)}>
                Pakai Voucher
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Customer Search */}
      <div className="space-y-4 border-l border-border pl-8">
        <div>
          <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
            <User className="w-4 h-4" /> Cari Pelanggan
          </Label>
          <p className="text-xs text-muted-foreground mb-4">
            Pilih pelanggan untuk melihat voucher yang mereka miliki.
          </p>
        </div>

        <CustomerCombobox
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={setSelectedCustomerId}
          initialCustomers={customers}
        />

        {/* Owned Vouchers List */}
        {selectedCustomerId && (
          <div className="mt-6 space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Voucher Dimiliki ({ownedVouchers.length})
            </Label>

            {isLoadingVouchers ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : ownedVouchers.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center border border-dashed">
                Pelanggan ini tidak memiliki voucher aktif.
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
                {ownedVouchers.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <div>
                      <p className="font-semibold text-sm">{v.voucherPacket.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{v.code}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-primary text-primary hover:bg-primary hover:text-white"
                      onClick={() => confirmRedeem(v)}
                    >
                      Pakai
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
