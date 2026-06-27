import { UseFormReturn } from "react-hook-form";
import { BookingInput } from "../../schemas/booking";
import { CalendarDays, Clock, MapPin, User, Scissors } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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
  let totalAmount = 0;
  let maxDuration = 0;
  const items = data.selections.map(sel => {
    const service = services.find(s => s.id === sel.serviceId);
    const staff = staffList.find(s => s.id === sel.staffId);
    if (service) {
      totalAmount += Number(service.price);
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
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-background rounded-2xl p-4 shadow-sm border border-border/50">
                <div className="flex items-start gap-3">
                  <div>
                    <div className="text-sm font-medium">{item.service?.name || "Layanan tidak ditemukan"}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <User className="w-3 h-3" /> {item.staff?.firstName || "Terapis: Siapa Saja"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    Rp {Number(item.service?.price || 0).toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.service?.duration || 60} mnt</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border/50 border-dashed pt-6" />

        {/* Total */}
        <div className="flex justify-between items-end">
          <div className="text-sm text-muted-foreground font-medium">Total Pembayaran</div>
          <div className="text-3xl font-display text-primary tracking-tight">
            Rp {totalAmount.toLocaleString('id-ID')}
          </div>
        </div>

      </div>
    </div>
  );
}
