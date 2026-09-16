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
  staffList?: any[];
}

export function StepTime({ form, dailySchedule, brandSetting, loading, services = [], staffList = [] }: StepTimeProps) {
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

        let busyStaffIds = new Set<string>();
        if (dailySchedule.staffSchedules) {
          dailySchedule.staffSchedules.forEach((staff: any) => {
            if (staff.sessions) {
              staff.sessions.forEach((sess: any) => {
                if (sess.startTime && sess.endTime) {
                  const sStart = new Date(sess.startTime);
                  const sEnd = new Date(sess.endTime);
                  if (slotStart < sEnd && slotEnd > sStart) {
                    busyStaffIds.add(staff.id);
                  }
                }
              });
            }
          });
        }

        const requiredPositions: string[] = [];
        (selections || []).forEach(sel => {
          if (sel.serviceId) {
            const svc = services?.find(s => s.id === sel.serviceId);
            if (svc?.category?.targetWorkPositionId) {
              requiredPositions.push(svc.category.targetWorkPositionId);
            } else {
              requiredPositions.push("ANY");
            }
          }
        });

        const availableStaffArr = (dailySchedule.staffSchedules || []).filter((s: any) => !busyStaffIds.has(s.id));
        let availableStaff = availableStaffArr.length;

        if (staffList && staffList.length > 0) {
          const availableDetailedStaff = staffList.filter((s: any) => availableStaffArr.some((a: any) => a.id === s.id));

          if (requiredPositions.length > 0) {
            const requiredCounts: Record<string, number> = {};
            requiredPositions.forEach(pos => {
              requiredCounts[pos] = (requiredCounts[pos] || 0) + 1;
            });

            let canFulfill = true;
            for (const pos in requiredCounts) {
              if (pos !== "ANY") {
                const availableForPos = availableDetailedStaff.filter((s: any) => s.workPositionId === pos).length;
                if (availableForPos < requiredCounts[pos]) {
                  canFulfill = false;
                  break;
                }
              }
            }

            if (!canFulfill) {
              availableStaff = 0;
            }
          } else {
            const validWorkPositions = new Set(
              (services || []).map(s => s.category?.targetWorkPositionId).filter(Boolean)
            );
            const hasAnyService = (services || []).some(s => !s.category?.targetWorkPositionId);

            if (hasAnyService) {
              availableStaff = availableDetailedStaff.length;
            } else {
              availableStaff = availableDetailedStaff.filter(s => validWorkPositions.has(s.workPositionId)).length;
            }
          }
        }

        slots.push({
          timeString: slotStart.toISOString(),
          label: slotStart.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          availableStaff
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
        <div className="space-y-4">
          <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-4">Pilih Tanggal</label>
          <div className="flex overflow-x-auto gap-4 mt-1 pb-4 snap-x scroll-smooth border-b border-border/10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {dates.map(dateStr => {
              const d = new Date(dateStr);
              const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
              const dateNum = d.getDate();
              const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={dateStr}
                  className={`snap-center shrink-0 w-16 pb-4 flex flex-col items-center justify-center cursor-pointer transition-all border-b-2 -mb-[1px] ${isSelected ? 'border-foreground text-primary border-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  onClick={() => {
                    form.setValue("date", dateStr, { shouldValidate: true });
                    form.setValue("startTime", "");
                  }}
                >
                  <span className="text-[9px] uppercase tracking-widest mb-1 opacity-80">{dayName}</span>
                  <span className="text-2xl font-light">{dateNum}</span>
                  <span className="text-[9px] uppercase tracking-widest mt-1 opacity-80">{monthName}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground block mb-4">Waktu Tersedia</label>
          {loading || !dailySchedule ? (
            <div className="py-8 text-center text-muted-foreground font-light text-[10px] uppercase tracking-[0.3em]">Mencari jadwal kosong...</div>
          ) : timeSlots.length === 0 ? (
            <div className="py-12 text-center border-y border-border/10">
              <p className="text-muted-foreground font-light">Tidak ada jadwal tersedia di tanggal ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2 pb-2">
              {timeSlots.map(slot => {
                const isSelected = selectedTime === slot.timeString;
                const requiredStaff = Math.max(1, (selections || []).length);
                const isFull = slot.availableStaff < requiredStaff;
                return (
                  <div
                    key={slot.timeString}
                    className={`py-3 px-2 flex flex-col text-center cursor-pointer transition-all border-b-2 ${isFull ? 'opacity-40 cursor-not-allowed border-transparent text-muted-foreground' : isSelected ? 'border-primary text-primary' : 'border-border/20 hover:border-primary/50 text-foreground hover:text-primary'}`}
                    onClick={() => {
                      if (!isFull) {
                        form.setValue("startTime", slot.timeString, { shouldValidate: true })
                      }
                    }}
                  >
                    <span className="text-xl font-light">{slot.label}</span>
                    <span className={`text-[9px] mt-1 tracking-widest uppercase ${isSelected ? 'text-primary/70' : isFull ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {isFull ? 'Penuh' : `${slot.availableStaff} Slot`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          {form.formState.errors.startTime && <p className="text-xs text-destructive mt-1">{form.formState.errors.startTime.message}</p>}
        </div>
      </div>
    </div>
  );
}
