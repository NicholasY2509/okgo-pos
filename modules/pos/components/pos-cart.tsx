"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePosCart } from "../stores/pos-store";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, User, Receipt, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm } from "../../customer/components/customer-form";

interface PosCartProps {
  cart: ReturnType<typeof usePosCart>;
  customers: any[];
  onCheckout: () => void;
}

export function PosCart({ cart, customers, onCheckout }: PosCartProps) {
  const { items, customerId, setCustomerId, removeItem, updateQuantity, subtotal, discountTotal, totalAmount } = cart;
  const router = useRouter();
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

  return (
    <>
      <div className="flex-1 bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col h-full relative overflow-hidden">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>

        <div className="flex items-center gap-2 mb-6 mt-1">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-bold text-foreground tracking-tight">Keranjang</h3>
          <div className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
            {items.reduce((acc, item) => acc + item.quantity, 0)} Item
          </div>
        </div>

        <div className="mb-5 bg-muted/50 p-3 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-semibold text-foreground">Pelanggan (Opsional)</Label>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto h-6 px-2 text-xs border-primary/20 text-primary hover:bg-primary/10" 
              onClick={() => setIsNewCustomerOpen(true)}
            >
              <UserPlus className="w-3 h-3 mr-1" /> Baru
            </Button>
          </div>
          <Select value={customerId || "none"} onValueChange={(val) => setCustomerId(val === "none" ? undefined : val)}>
            <SelectTrigger className="bg-background border-input">
              <SelectValue placeholder="Pilih Pelanggan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Tanpa Pelanggan --</SelectItem>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[200px] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {items.length === 0 ? (
            <div className="h-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
              <ShoppingCart className="w-12 h-12 mb-3 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">Keranjang kosong</p>
              <p className="text-sm text-muted-foreground/80 mt-1">Pilih layanan atau paket di sebelah kiri</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartId} className="p-4 border border-border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                {/* Type indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'VOUCHER_PACKET' ? 'bg-primary/60' : 'bg-primary'}`}></div>

                <div className="flex justify-between items-start mb-3 pl-2">
                  <div className="pr-4">
                    <h4 className="font-semibold text-foreground leading-tight">{item.name}</h4>
                    {item.type === "SERVICE" && (
                      <div className="flex flex-col gap-0.5 mt-1.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="font-medium text-foreground">Terapis:</span> {item.staffName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="font-medium text-foreground">Ruang:</span> {item.roomName}
                        </p>
                      </div>
                    )}
                    {item.type === "VOUCHER_PACKET" && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm tracking-wide uppercase">
                        Voucher
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
                  <div className="flex items-center border border-border rounded-lg bg-muted/50 shadow-sm overflow-hidden">
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
                  <span className="font-bold text-primary">
                    Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border pt-5 mt-4 bg-card relative z-10">
          <div className="space-y-2.5 mb-5">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-sm font-medium text-primary bg-primary/5 p-1.5 rounded-md px-2 -mx-2">
                <span>Diskon</span>
                <span>- Rp {discountTotal.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 border-t border-border">
              <span className="text-foreground font-bold">Total Pembayaran</span>
              <span className="text-2xl font-extrabold text-primary">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground py-6 text-lg font-bold hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none gap-2"
            onClick={onCheckout}
            disabled={items.length === 0}
          >
            <Receipt className="w-5 h-5" />
            Proses Pembayaran
          </Button>
        </div>
      </div>

      {/* New Customer Dialog */}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <CustomerForm 
              onSuccess={(customer) => {
                setIsNewCustomerOpen(false);
                router.refresh();
                setCustomerId(customer.id);
              }}
              onCancel={() => setIsNewCustomerOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
