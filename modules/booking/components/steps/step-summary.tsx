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
      <div className="space-y-3 text-left border-b border-border/10 pb-8">
        <h2 className="text-3xl md:text-4xl font-display font-light tracking-tight text-foreground">Ringkasan Booking</h2>
        <p className="text-muted-foreground font-light text-sm">Harap periksa kembali detail pesanan Anda sebelum mengonfirmasi.</p>
      </div>

      <div className="space-y-12 mt-8 pt-4">

        {/* Identity & Location - Stacked Layout */}
        <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-16">
          <div className="space-y-8 flex-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-3">Pemesan</div>
              <div className="font-light text-foreground text-lg md:text-xl">{data.customerName}</div>
              <div className="text-sm text-muted-foreground font-light mt-1.5">{data.customerPhone}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-3">Cabang</div>
              <div className="font-light text-foreground text-lg md:text-xl">{branch?.name || "-"}</div>
            </div>
          </div>

          <div className="space-y-8 flex-1">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-3">Tanggal & Waktu</div>
              <div className="text-lg md:text-xl text-foreground font-light">
                {format(parsedDate, "EEEE, d MMMM yyyy", { locale: id })}
              </div>
              <div className="text-sm text-muted-foreground font-light mt-1.5">
                Pukul {timeString}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Services */}
        <div className="space-y-8 pt-10 border-t border-border/10">
          <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Daftar Layanan
          </div>

          <div className="space-y-8">
            {items.map((item, i) => {
              const itemSelection = selections[i];
              const appliedItemVoucher = itemSelection?.appliedVoucherCode;
              const hasVoucher = !!appliedItemVoucher;

              return (
                <div key={i} className="flex flex-col gap-4 group transition-all">
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="text-lg md:text-xl font-light text-foreground leading-tight">{item.service?.name || "Layanan Belum Dipilih"}</div>
                      {item.service && (
                        <div className="text-sm text-muted-foreground font-light mt-2 flex items-center gap-2">
                          <User className="w-4 h-4 opacity-70 shrink-0" /> <span className="truncate">{item.staff?.firstName || "Terapis: Siapa Saja"}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg md:text-xl font-light text-foreground tracking-wide whitespace-nowrap">
                        {hasVoucher ? (
                          <span className="line-through text-muted-foreground/50 text-sm mr-2">
                            {item.service ? `Rp ${Number(item.service.price || 0).toLocaleString('id-ID')}` : ""}
                          </span>
                        ) : null}
                        {hasVoucher ? <span className="text-primary font-medium">Gratis</span> : (item.service ? `Rp ${Number(item.service.price || 0).toLocaleString('id-ID')}` : "Rp 0")}
                      </div>
                      <div className="text-sm text-muted-foreground font-light mt-2">{item.service?.duration || 60} menit</div>
                    </div>
                  </div>

                  {hasVoucher && (
                    <div className="flex justify-between items-center bg-primary/[0.03] border border-primary/10 p-3">
                      <div className="flex items-center gap-3">
                        <Ticket className="w-4 h-4 text-primary" />
                        <span className="text-xs font-light text-primary tracking-wide">{appliedItemVoucher}</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveItemVoucher(i)} className="text-[9px] uppercase tracking-[0.2em] font-medium text-destructive hover:opacity-70 transition-opacity">
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
        <div className="pt-10 border-t border-border/10 space-y-6">
          <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Voucher Potongan Total (Opsional)
          </div>

          {appliedVoucher ? (
            <div className="flex justify-between items-center bg-primary/[0.03] border border-primary/10 p-4">
              <div className="flex items-center gap-4">
                <Ticket className="w-5 h-5 text-primary opacity-80" />
                <div>
                  <div className="text-base font-light text-foreground tracking-wide">{appliedVoucher.code}</div>
                  <div className="text-xs text-primary font-light mt-1">Voucher diterapkan secara global</div>
                </div>
              </div>
              <button type="button" onClick={handleRemoveVoucher} className="text-[10px] uppercase tracking-[0.2em] font-medium text-destructive hover:opacity-70 transition-opacity p-2">
                Hapus
              </button>
            </div>
          ) : (
            showVoucherInput ? (
              <div className="space-y-4">
                <div className="flex gap-4 items-end">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value)}
                    placeholder="Masukkan kode voucher"
                    className="flex-1 bg-transparent px-0 py-3 border-b border-border/30 focus:border-foreground focus:outline-none focus:ring-0 text-base font-light transition-colors placeholder:text-muted-foreground/30 uppercase"
                  />
                  <Button type="button" variant="outline" className="rounded-none border-foreground/30 hover:border-foreground hover:bg-transparent hover:text-foreground uppercase tracking-[0.2em] font-light text-xs px-8 h-12" onClick={handleApplyVoucher} disabled={isVerifying || !voucherCode.trim()}>
                    {isVerifying ? "Cek..." : "Terapkan"}
                  </Button>
                </div>
                {voucherError && <p className="text-xs text-destructive font-light">{voucherError}</p>}
                <p className="text-xs text-muted-foreground font-light italic">Saldo voucher akan diverifikasi dan dipotong saat pembayaran di kasir.</p>
              </div>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setShowVoucherInput(true)} className="w-full rounded-none border-b border-border/10 h-14 font-light tracking-[0.2em] uppercase text-sm hover:bg-transparent text-muted-foreground hover:text-foreground transition-all flex justify-between px-2">
                <span>Gunakan Voucher</span>
                <Ticket className="w-4 h-4 opacity-50" />
              </Button>
            )
          )}
        </div>

        {/* Total */}
        <div className="pt-10 border-t border-border/10 flex justify-between items-end gap-6 mt-12 mb-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground pb-2">Total Tagihan</div>
          <div className="text-right">
            {appliedVoucher && (
              <div className="text-sm text-primary font-light mb-2 line-through opacity-70">
                Rp {totalAmount.toLocaleString('id-ID')}
              </div>
            )}
            <div className="text-4xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight">
              <span className="text-xl text-muted-foreground mr-3 font-sans tracking-normal">Rp</span>{finalAmount.toLocaleString('id-ID')}
            </div>
            {appliedVoucher && (
              <div className="text-[10px] text-muted-foreground font-light mt-3 uppercase tracking-widest">*Harga setelah potongan</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
