import { UseFormReturn } from "react-hook-form";
import { BookingInput } from "../../schemas/booking";
import { CalendarDays, Clock, MapPin, User, Scissors, Ticket } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { validateVoucherAction } from "../../actions/booking-actions";

interface StepSummaryProps {
  form: UseFormReturn<BookingInput>;
  services: any[];
  staffList: any[];
  branches: any[];
}

export function StepSummary({ form, services, staffList, branches }: StepSummaryProps) {
  const data = form.getValues();
  const branch = branches.find(b => b.id === data.branchId);

  // Calculate Subtotal and Max Duration
  const selections = form.watch("selections") || [];
  let totalAmount = 0;
  let maxDuration = 0;
  const items = selections.map(sel => {
    const service = services.find(s => s.id === sel.serviceId);
    const staff = staffList.find(s => s.id === sel.staffId);
    if (service) {
      if (!sel.appliedVoucherId) {
        totalAmount += Number(service.price);
      }
      if (service.duration > maxDuration) maxDuration = service.duration;
    }
    return { service, staff };
  });

  const parsedDate = data.date ? new Date(data.date) : new Date();

  let timeString = "-";
  if (data.startTime) {
    const startObj = new Date(data.startTime);
    const startHours = startObj.getHours().toString().padStart(2, '0');
    const startMinutes = startObj.getMinutes().toString().padStart(2, '0');

    timeString = `${startHours}:${startMinutes} WIB`;
  }

  const appliedVoucherId = form.watch("appliedVoucherId");
  const [showVoucherInput, setShowVoucherInput] = useState(!!appliedVoucherId);
  const [voucherCode, setVoucherCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null); // For total discount voucher

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsVerifying(true);
    setVoucherError("");
    const res = await validateVoucherAction(voucherCode.trim());
    setIsVerifying(false);
    
    if (res.success && res.data) {
      const voucher = res.data;
      const isServiceVoucher = voucher.voucherPacket?.productId != null;

      if (isServiceVoucher) {
        const requiredProductId = voucher.voucherPacket.productId;
        
        // Find an item in selections that matches requiredProductId AND doesn't have an appliedVoucherId yet
        const currentSelections = form.getValues("selections") || [];
        const matchIndex = currentSelections.findIndex((sel: any) => sel.serviceId === requiredProductId && !sel.appliedVoucherId);
        
        if (matchIndex === -1) {
          const hasMatchingService = currentSelections.some((sel: any) => sel.serviceId === requiredProductId);
          if (hasMatchingService) {
             setVoucherError("Layanan ini sudah menggunakan voucher maksimal (1 per layanan).");
          } else {
             const selectedServiceNames = items.map(i => i.service?.name).filter(Boolean).join(", ");
             const voucherServiceName = voucher.voucherPacket.product?.name || voucher.voucherPacket.name;
             setVoucherError(`Voucher tidak sesuai. Voucher adalah layanan ${voucherServiceName} sedangkan anda memilih layanan ${selectedServiceNames || "lain"}.`);
          }
          return;
        }

        // Apply it
        form.setValue(`selections.${matchIndex}.appliedVoucherId`, voucher.id, { shouldValidate: true });
        form.setValue(`selections.${matchIndex}.appliedVoucherCode`, voucher.code, { shouldValidate: true });
        toast.success(`Voucher layanan ${voucher.code} berhasil diterapkan!`);
        
      } else {
        // Total voucher
        const currentTotalVoucher = form.getValues("appliedVoucherId");
        if (currentTotalVoucher && currentTotalVoucher !== voucher.id) {
           setVoucherError("Hanya 1 voucher potongan total yang dapat digunakan.");
           return;
        }
        setAppliedVoucher(res.data);
        form.setValue("appliedVoucherId", res.data.id, { shouldValidate: true });
        toast.success("Voucher potongan total berhasil diterapkan!");
      }
      
      setVoucherCode(""); // Clear input
    } else {
      setVoucherError(res.error || "Gagal memverifikasi voucher");
    }
  };

  const handleRemoveVoucher = () => {
    form.setValue("appliedVoucherId", "", { shouldValidate: true });
    setAppliedVoucher(null);
  };
  
  const handleRemoveItemVoucher = (index: number) => {
    form.setValue(`selections.${index}.appliedVoucherId`, undefined, { shouldValidate: true });
    form.setValue(`selections.${index}.appliedVoucherCode`, undefined, { shouldValidate: true });
  };


  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.remainingCreditAmount) {
      discountAmount = Number(appliedVoucher.remainingCreditAmount);
    }
  }
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  return (

    <div className="space-y-10 animate-in slide-in-from-right-8 fade-in duration-300">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-display font-light tracking-tight">Ringkasan Booking</h2>
        <p className="text-muted-foreground font-light text-sm">Periksa kembali detail pesanan Anda sebelum konfirmasi.</p>
      </div>

      <div className="bg-muted/10 rounded-3xl p-6 border border-border/50 space-y-6">

        {/* Identity & Location */}
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start gap-4">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground shrink-0 mt-0.5">Pemesan</div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">{data.customerName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{data.customerPhone}</div>
            </div>
          </div>

          <div className="flex justify-between items-start gap-4">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground shrink-0 mt-0.5">Cabang</div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">{branch?.name || "-"}</div>
            </div>
          </div>

          <div className="flex justify-between items-start gap-4">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground shrink-0 mt-0.5">Jadwal</div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {format(parsedDate, "EEEE, d MMMM yyyy", { locale: id })}
              </div>
              <div className="text-xs font-medium text-primary mt-0.5">
                {timeString}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 border-dashed pt-6" />

        {/* Selected Services */}
        <div className="space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Daftar Layanan
          </div>

          <div className="space-y-3">
            {items.map((item, i) => {
              const itemSelection = selections[i];
              const appliedItemVoucher = itemSelection?.appliedVoucherCode;
              const hasVoucher = !!appliedItemVoucher;
              
              return (
              <div key={i} className="flex flex-col bg-background rounded-2xl p-4 shadow-sm border border-border/50 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="text-sm font-medium">{item.service?.name || "Tidak memilih layanan spesifik"}</div>
                      {item.service && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" /> {item.staff?.firstName || "Terapis: Siapa Saja"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {hasVoucher ? (
                        <div className="text-xs text-muted-foreground line-through">
                           {item.service ? `Rp ${Number(item.service.price || 0).toLocaleString('id-ID')}` : "Rp 0"}
                        </div>
                      ) : (
                         item.service ? `Rp ${Number(item.service.price || 0).toLocaleString('id-ID')}` : "Rp 0"
                      )}
                      {hasVoucher && <div className="text-primary font-bold">Gratis</div>}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.service?.duration || 60} mnt</div>
                  </div>
                </div>
                
                {hasVoucher && (
                  <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-xl p-3 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/20 p-1.5 rounded-full text-primary">
                        <Ticket className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{appliedItemVoucher}</div>
                        <div className="text-[10px] text-primary">Voucher Layanan</div>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItemVoucher(i)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full text-xs h-7 px-2">
                      Hapus
                    </Button>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>

        <div className="border-t border-border/50 border-dashed pt-6" />

        {/* Voucher Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Voucher (Opsional)
            </div>
          </div>
          
          {appliedVoucher ? (
            <div className="flex justify-between items-center bg-primary/10 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full text-primary">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{appliedVoucher.code}</div>
                  <div className="text-xs text-primary mt-0.5">Voucher diterapkan</div>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleRemoveVoucher} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full text-xs">
                Hapus
              </Button>
            </div>
          ) : (
            showVoucherInput ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    value={voucherCode} 
                    onChange={e => setVoucherCode(e.target.value)} 
                    placeholder="Masukkan kode voucher" 
                    className="rounded-full bg-background"
                  />
                  <Button type="button" onClick={handleApplyVoucher} disabled={isVerifying || !voucherCode.trim()} className="rounded-full shrink-0">
                    {isVerifying ? "Cek..." : "Terapkan"}
                  </Button>
                </div>
                {voucherError && <p className="text-xs text-destructive pl-2">{voucherError}</p>}
                <p className="text-xs text-muted-foreground pl-2 italic">Saldo voucher akan dipotong saat Anda membayar di kasir.</p>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => setShowVoucherInput(true)} className="w-full rounded-full border-dashed">
                <Ticket className="w-4 h-4 mr-2" />
                Gunakan Voucher
              </Button>
            )
          )}
        </div>

        <div className="border-t border-border/50 border-dashed pt-6" />

        {/* Total */}
        <div className="flex justify-between items-end">
          <div className="text-sm text-muted-foreground font-medium">Total Pembayaran</div>
          <div className="text-right">
            {appliedVoucher && (
              <div className="text-xs text-primary font-medium mb-1 line-through opacity-70">
                Rp {totalAmount.toLocaleString('id-ID')}
              </div>
            )}
            <div className="text-3xl font-display text-primary tracking-tight">
              Rp {finalAmount.toLocaleString('id-ID')}
            </div>
            {appliedVoucher && (
              <div className="text-xs text-muted-foreground mt-1">*Harga akhir setelah potongan voucher</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
