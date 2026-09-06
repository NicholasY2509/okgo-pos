import { UseFormReturn } from "react-hook-form";
import { BookingInput } from "../../schemas/booking";
import { useEffect, useMemo, useState } from "react";
import { addMinutes, startOfDay, isBefore, addHours } from "date-fns";

interface StepTimeProps {
  form: UseFormReturn<BookingInput>;
  dailySchedule: any;
  brandSetting?: any;
  loading: boolean;
  services?: any[];
}

export function StepTime({ form, dailySchedule, brandSetting, loading, services = [] }: StepTimeProps) {
  const selectedTime = form.watch("startTime");
  const selectedDate = form.watch("date");

  // Generate next 7 days starting from today
  const dates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
  }, []);

  useEffect(() => {
    if (!selectedDate || !dates.includes(selectedDate)) {
      form.setValue("date", dates[0], { shouldValidate: true });
    }
  }, [dates, selectedDate, form]);

  const selections = form.watch("selections");
  const totalDuration = useMemo(() => {
    let duration = 0;
    if (selections && selections.length > 0) {
      selections.forEach(sel => {
        if (sel.serviceId) {
          const service = services.find(s => s.id === sel.serviceId);
          if (service) {
            duration += (service.duration || 60);
          }
        }
      });
    }
    return duration > 0 ? duration : 30; // Default to 30 if no services selected yet
  }, [selections, services]);

  const timeSlots = useMemo(() => {
    if (!selectedDate || !dailySchedule) return [];
    const date = new Date(selectedDate);

    // Parse business hours from settings or use defaults
    let businessStart = 8;
    let businessEnd = 22;

    if (brandSetting) {
      if (brandSetting.businessStartTime) {
        businessStart = parseInt(brandSetting.businessStartTime.split(':')[0], 10);
      }
      if (brandSetting.businessEndTime) {
        businessEnd = parseInt(brandSetting.businessEndTime.split(':')[0], 10);
      }
    }

    const slots = [];
    const now = new Date();
    const minTime = addHours(now, 2);

    for (let hour = businessStart; hour <= businessEnd; hour++) {
      for (let min of [0]) {
        // Skip 22:00 if it's the exact end time and we don't want bookings at the exact closing minute
        // Actually, let's keep it strictly < businessEnd if we want the last slot to be before closing
        // If businessEnd is 21:00, last slot is 20:00 (if we do hour < businessEnd). Let's stick to the previous logic hour < businessEnd.
        // Wait, if businessEnd is 22, it was hour < 22, so last was 21:00. Let's do hour < businessEnd.
        if (hour === businessEnd) continue;
        const slotStart = new Date(date);
        slotStart.setHours(hour, min, 0, 0);

        // Calculate slot end based on selected services' total duration
        const slotEnd = addMinutes(slotStart, totalDuration);

        if (isBefore(slotStart, minTime)) continue;

        let activeRoomSessions = 0;
        dailySchedule.roomSessions.forEach((sess: any) => {
          if (sess.startTime && sess.endTime) {
            const sStart = new Date(sess.startTime);
            const sEnd = new Date(sess.endTime);
            if (slotStart < sEnd && slotEnd > sStart) {
              activeRoomSessions++;
            }
          }
        });

        const availableRooms = Math.max(0, dailySchedule.totalCapacity - activeRoomSessions);

        slots.push({
          timeString: slotStart.toISOString(),
          label: slotStart.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          availableRooms
        });
      }
    }
    return slots;
  }, [selectedDate, dailySchedule, brandSetting, totalDuration]);

  return (
    <div className="space-y-10 animate-in slide-in-from-right-8 fade-in duration-300">
      <div className="space-y-2 text-left">
        <h2 className="text-3xl font-display font-light tracking-tight">Kapan kamu akan datang?</h2>
        <p className="text-muted-foreground font-light text-sm">Pilih jadwal minimal 2 jam dari sekarang.</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2 mb-1">Pilih Tanggal</label>
          <div className="flex overflow-x-auto gap-3 pb-4 snap-x scroll-smooth px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {dates.map(dateStr => {
              const d = new Date(dateStr);
              const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
              const dateNum = d.getDate();
              const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={dateStr}
                  className={`snap-center shrink-0 w-18 h-20 flex flex-col items-center justify-center rounded-2xl border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border/50 bg-muted/10 hover:bg-muted/30 text-foreground'}`}
                  onClick={() => {
                    form.setValue("date", dateStr, { shouldValidate: true });
                    form.setValue("startTime", "");
                  }}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-80">{dayName}</span>
                  <span className="text-xl font-medium my-0.5">{dateNum}</span>
                  <span className="text-[10px] uppercase opacity-80">{monthName}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2 block mb-2">Waktu Tersedia</label>
          {loading || !dailySchedule ? (
            <div className="py-8 text-center text-muted-foreground font-light text-xs uppercase tracking-widest">Mencari jadwal kosong...</div>
          ) : timeSlots.length === 0 ? (
            <div className="py-12 text-center bg-muted/10 border border-border/30 rounded-2xl">
              <p className="text-muted-foreground font-light">Tidak ada jadwal tersedia di tanggal ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2 pb-2">
              {timeSlots.map(slot => {
                const isSelected = selectedTime === slot.timeString;
                const requiredRooms = Math.max(1, (selections || []).length);
                const isFull = slot.availableRooms < requiredRooms;
                return (
                  <div
                    key={slot.timeString}
                    className={`py-3 px-2 flex flex-col text-center cursor-pointer transition-all rounded-2xl border font-medium ${isFull ? 'opacity-50 cursor-not-allowed border-border/50 bg-muted/10 text-muted-foreground' : isSelected ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border/50 bg-muted/10 hover:bg-muted/30 text-foreground'}`}
                    onClick={() => {
                      if (!isFull) {
                        form.setValue("startTime", slot.timeString, { shouldValidate: true })
                      }
                    }}
                  >
                    <span className="text-lg">{slot.label}</span>
                    <span className={`text-[10px] mt-1 font-normal ${isSelected ? 'text-primary-foreground/80' : isFull ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {isFull ? 'Penuh' : `${slot.availableRooms} Ruang Tersedia`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          {form.formState.errors.startTime && <p className="text-xs text-destructive ml-2 mt-1">{form.formState.errors.startTime.message}</p>}
        </div>
      </div>
    </div>
  );
}
