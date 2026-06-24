"use client";

import { useState, useEffect } from "react";
import { User, Search, Ticket, CheckCircle2, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCustomerVouchersAction, getVoucherByCodeAction } from "../../vouchers/actions/get-customer-vouchers-action";

interface VoucherRedeemTabProps {
  customers: any[];
  onRedeemVoucher: (voucher: any) => void;
}

export function VoucherRedeemTab({ customers, onRedeemVoucher }: VoucherRedeemTabProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [serialNumber, setSerialNumber] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  
  const [ownedVouchers, setOwnedVouchers] = useState<any[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    async function fetchVouchers() {
      if (!selectedCustomerId) {
        setOwnedVouchers([]);
        return;
      }
      setIsLoadingVouchers(true);
      const result = await getCustomerVouchersAction(selectedCustomerId);
      if (result.success && result.data) {
        setOwnedVouchers(result.data);
      } else {
        toast.error("Gagal mengambil data voucher pelanggan.");
      }
      setIsLoadingVouchers(false);
    }
    fetchVouchers();
  }, [selectedCustomerId]);

  const handleRedeem = async (code?: string) => {
    const codeToRedeem = code || serialNumber;
    if (!codeToRedeem) {
      toast.error("Masukkan kode voucher terlebih dahulu");
      return;
    }

    if (code) {
      // It came from the list, we already have the object in `ownedVouchers`
      const voucher = ownedVouchers.find(v => v.code === code);
      if (voucher) {
        onRedeemVoucher(voucher);
      }
    } else {
      // Manual entry
      setIsRedeeming(true);
      const result = await getVoucherByCodeAction(codeToRedeem);
      setIsRedeeming(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        onRedeemVoucher(result.data);
        setSerialNumber("");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-6">
          <Ticket className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Redeem Voucher</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Manual Entry */}
          <div className="space-y-4 flex flex-col">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Redeem Manual</Label>
              <p className="text-xs text-muted-foreground mb-4">
                Masukkan nomor seri voucher secara manual untuk melakukan redeem.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Masukkan nomor seri..."
                  className="pl-9"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
              <Button onClick={() => handleRedeem()} disabled={isRedeeming} className="font-semibold">
                {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redeem"}
              </Button>
            </div>
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

            <Popover open={isCustomerDropdownOpen} onOpenChange={setIsCustomerDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isCustomerDropdownOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedCustomerId
                    ? customers.find((c) => c.id === selectedCustomerId)?.name + (customers.find((c) => c.id === selectedCustomerId)?.phone ? ` (${customers.find((c) => c.id === selectedCustomerId)?.phone})` : "")
                    : "Cari pelanggan..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Ketik nama atau nomor telepon..." />
                  <CommandList>
                    <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.name} ${c.phone || ""}`}
                          onSelect={() => {
                            setSelectedCustomerId(c.id === selectedCustomerId ? undefined : c.id);
                            setIsCustomerDropdownOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCustomerId === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c.name} {c.phone ? `(${c.phone})` : ""}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

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
                          onClick={() => handleRedeem(v.code)}
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
      </div>
    </div>
  );
}
