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
    <div className="space-y-8 md:space-y-12 animate-in slide-in-from-right-8 fade-in duration-500">
      <div className="space-y-2 md:space-y-3 text-left">
        <h2 className="text-2xl md:text-4xl font-display font-light tracking-tight text-foreground">Ringkasan Booking</h2>
        <p className="text-muted-foreground font-light text-xs md:text-sm">Harap periksa kembali detail pesanan Anda sebelum mengonfirmasi.</p>
      </div>

      <div className="bg-background rounded-3xl md:rounded-[2rem] p-5 md:p-8 border border-border/40 shadow-sm space-y-8 md:space-y-10">

        {/* Identity & Location - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-y-8 gap-x-6">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-0">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-1 md:mb-2">Pemesan</div>
              <div className="font-light text-foreground text-base md:text-xl">{data.customerName}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground font-light mt-0.5 md:mt-1">{data.customerPhone}</div>
            </div>
            <div className="md:mt-8">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-1 md:mb-2">Cabang</div>
              <div className="font-light text-foreground text-base md:text-xl">{branch?.name || "-"}</div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-1 md:mb-2">Waktu Kunjungan</div>
            <div className="font-light text-foreground text-lg md:text-2xl tracking-wide">
              {format(parsedDate, "EEEE, d MMMM yyyy", { locale: id })}
            </div>
            <div className="text-base md:text-lg font-light text-primary mt-1 flex items-center gap-1.5 md:gap-2">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-70" />
              {timeString}
            </div>
          </div>
        </div>

        {/* Selected Services */}
        <div className="space-y-4 md:space-y-6 pt-6 md:pt-8 border-t border-border/40">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-1 md:mb-2">
            Daftar Layanan
          </div>

          <div className="space-y-5 md:space-y-6">
            {items.map((item, i) => {
              const itemSelection = selections[i];
              const appliedItemVoucher = itemSelection?.appliedVoucherCode;
              const hasVoucher = !!appliedItemVoucher;

              return (
                <div key={i} className="flex flex-col gap-2.5 md:gap-3 group transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-base md:text-lg font-light text-foreground leading-tight md:leading-normal">{item.service?.name || "Layanan Belum Dipilih"}</div>
                      {item.service && (
                        <div className="text-[10px] md:text-xs text-muted-foreground font-light mt-1 md:mt-1.5 flex items-center gap-1.5">
                          <User className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-70 shrink-0" /> <span className="truncate">{item.staff?.firstName || "Terapis: Siapa Saja"}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base md:text-lg font-light text-foreground tracking-wide whitespace-nowrap">
                        {hasVoucher ? (
                          <span className="line-through text-muted-foreground/50 text-xs md:text-sm mr-1.5 md:mr-2">
                            {item.service ? `Rp ${Number(item.service.price || 0).toLocaleString('id-ID')}` : ""}
                          </span>
                        ) : null}
                        {hasVoucher ? <span className="text-primary font-medium">Gratis</span> : (item.service ? `Rp ${Number(item.service.price || 0).toLocaleString('id-ID')}` : "Rp 0")}
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground font-light mt-1 md:mt-1.5">{item.service?.duration || 60} menit</div>
                    </div>
                  </div>

                  {hasVoucher && (
                    <div className="flex justify-between items-center bg-primary/5 rounded-lg py-2 px-2.5 md:py-2.5 md:px-3">
                      <div className="flex items-center gap-2 md:gap-2.5">
                        <Ticket className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary" />
                        <span className="text-[10px] md:text-xs font-light text-primary tracking-wide">{appliedItemVoucher}</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveItemVoucher(i)} className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-medium text-destructive hover:opacity-70 transition-opacity">
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Voucher Section */}
        <div className="pt-6 md:pt-8 border-t border-border/40 space-y-3 md:space-y-4">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            Voucher Potongan Total (Opsional)
          </div>

          {appliedVoucher ? (
            <div className="flex justify-between items-center bg-primary/5 border border-primary/10 rounded-xl md:rounded-2xl p-3 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                <Ticket className="w-4 h-4 md:w-5 md:h-5 text-primary opacity-80" />
                <div>
                  <div className="text-xs md:text-sm font-medium text-foreground tracking-wide">{appliedVoucher.code}</div>
                  <div className="text-[9px] md:text-[10px] text-primary font-light mt-0.5">Voucher diterapkan secara global</div>
                </div>
              </div>
              <button type="button" onClick={handleRemoveVoucher} className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-medium text-destructive hover:opacity-70 transition-opacity p-2">
                Hapus
              </button>
            </div>
          ) : (
            showVoucherInput ? (
              <div className="space-y-2.5 md:space-y-3">
                <div className="flex gap-2 md:gap-3">
                  <Input
                    value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value)}
                    placeholder="Masukkan kode voucher"
                  />
                  <Button type="button" onClick={handleApplyVoucher} disabled={isVerifying || !voucherCode.trim()}>
                    {isVerifying ? "Cek..." : "Terapkan"}
                  </Button>
                </div>
                {voucherError && <p className="text-[10px] md:text-xs text-destructive font-light">{voucherError}</p>}
                <p className="text-[9px] md:text-[11px] text-muted-foreground font-light italic">Saldo voucher akan diverifikasi dan dipotong saat pembayaran di kasir.</p>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => setShowVoucherInput(true)} className="w-full rounded-xl md:rounded-2xl border-dashed border-border/50 h-12 md:h-14 font-light tracking-wide text-xs md:text-sm hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-all">
                <Ticket className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 opacity-70" />
                Gunakan Voucher
              </Button>
            )
          )}
        </div>

        {/* Total */}
        <div className="pt-6 md:pt-8 border-t border-border/40 flex justify-between items-center md:items-end gap-4">
          <div className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Total Tagihan</div>
          <div className="text-right">
            {appliedVoucher && (
              <div className="text-xs md:text-sm text-primary font-light mb-0.5 md:mb-1 line-through opacity-70">
                Rp {totalAmount.toLocaleString('id-ID')}
              </div>
            )}
            <div className="text-3xl md:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
              <span className="text-base md:text-2xl text-muted-foreground mr-1">Rp</span>{finalAmount.toLocaleString('id-ID')}
            </div>
            {appliedVoucher && (
              <div className="text-[9px] md:text-xs text-muted-foreground font-light mt-1 md:mt-2">*Harga akhir setelah potongan voucher</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
