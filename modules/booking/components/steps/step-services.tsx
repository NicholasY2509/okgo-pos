import { useState } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { BookingInput } from "../../schemas/booking";
import { Button } from "@/components/ui/button";
import { Plus, X, Info, ChevronLeft, AlertTriangle } from "lucide-react";
import { addMinutes } from "date-fns";

interface StepServicesProps {
  form: UseFormReturn<BookingInput>;
  services: any[];
  staffList: any[];
  dailySchedule: any;
  loading: boolean;
}

export function StepServices({ form, services, staffList, dailySchedule, loading }: StepServicesProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "selections"
  });

  const handleAdd = () => {
    append({ serviceId: "", staffId: undefined });
  };

  const categories = Array.from(
    new Map(
      services.map((s) => [s.category?.id || "other", { id: s.category?.id || "other", name: s.category?.name || "Lainnya" }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const [activeCategories, setActiveCategories] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach((field: any) => {
      if (field.serviceId) {
        const service = services.find((s) => s.id === field.serviceId);
        if (service) {
          initial[field.id] = service.category?.id || "other";
        }
      }
    });
    return initial;
  });

  const handleCategoryChange = (fieldId: string, categoryId: string) => {
    setActiveCategories((prev) => ({ ...prev, [fieldId]: categoryId }));
  };

  const selectedTime = form.watch("startTime");

  const checkStaffBusy = (staffId: string, start: Date, end: Date) => {
    if (!dailySchedule) return false;
    const staffSched = dailySchedule.staffSchedules.find((s: any) => s.id === staffId);
    if (!staffSched) return false;

    for (const session of staffSched.sessions) {
      const sStart = new Date(session.startTime);
      const sEnd = new Date(session.endTime);
      if (start < sEnd && end > sStart) {
        return `Sibuk ${sStart.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${sEnd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
      }
    }
    return false;
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h2 className="text-3xl font-display font-light tracking-tight">Pilih Layanan</h2>
        </div>
      </div>

      <div className="flex gap-2 items-start text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
        <p className="leading-relaxed text-[11px]">
          Pilih layanan yang ingin Anda pesan. Setelah memilih layanan, Anda bisa menentukan terapis pilihan (opsional). Untuk booking lebih dari satu layanan atau untuk banyak orang, gunakan tombol <b>Tambah Layanan Lagi</b>.
        </p>
      </div>

      <div className="space-y-6">
        {fields.map((field, index) => {
          const selectedServiceId = form.watch(`selections.${index}.serviceId`);

          return (
            <div key={field.id} className="rounded-3xl border border-border/50 bg-background shadow-sm p-4 relative">
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => remove(index)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-destructive h-8 w-8 p-0 rounded-full transition-colors hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-3">
                Layanan {index + 1}
              </h3>

              {!activeCategories[field.id] ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 animate-in fade-in zoom-in-95 duration-300">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(field.id, cat.id)}
                      className="p-6 cursor-pointer transition-all rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/30 hover:border-primary/50 text-left flex flex-col justify-center items-center gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="font-display text-xl font-light">{cat.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-foreground text-lg text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 justify-between mb-4 animate-in fade-in duration-300">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCategoryChange(field.id, "")}
                      className="rounded-full text-xs px-0"
                    >
                      <ChevronLeft className="h-2 w-2" />
                      Kembali ke Kategori
                    </Button>
                    <span className="text-lg font-display text-foreground">
                      {categories.find(c => c.id === activeCategories[field.id])?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-2 animate-in fade-in slide-in-from-top-4 duration-300">
                    {services
                      .filter((service) => {
                        const activeCatId = activeCategories[field.id];
                        return (service.categoryId || "other") === activeCatId;
                      })
                      .map((service) => (
                        <div
                          key={service.id}
                          className={`p-4 cursor-pointer transition-all rounded-2xl border flex flex-col justify-center ${selectedServiceId === service.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/50 bg-muted/10 hover:bg-muted/30"
                            }`}
                          onClick={() =>
                            form.setValue(
                              `selections.${index}.serviceId`,
                              selectedServiceId === service.id ? "" : service.id,
                              { shouldValidate: true }
                            )
                          }
                        >
                          <div className="font-medium text-foreground text-base mb-1">{service.name}</div>
                          <div className="text-[10px] text-muted-foreground font-light flex justify-between uppercase tracking-widest">
                            <span>{service.duration} mnt</span>
                            <span className="font-medium text-primary">
                              Rp {Number(service.price).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {selectedServiceId && (
                    <div className="mt-6 border-t border-border/50 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2 mb-3">Pilih Terapis (Opsional)</h4>
                      {(() => {
                        const selectedStaffId = form.watch(`selections.${index}.staffId`);
                        const selectedService = services.find(s => s.id === selectedServiceId);
                        
                        let eligibleStaffList = staffList;
                        if (selectedService && selectedService.category && selectedService.category.targetWorkPositionId) {
                          eligibleStaffList = staffList.filter(s => s.workPositionId === selectedService.category.targetWorkPositionId);
                        }

                        const duration = selectedService?.duration || 60;
                        const itemStartTime = selectedTime ? new Date(selectedTime) : new Date();
                        const itemEndTime = addMinutes(itemStartTime, duration);

                        return (
                          <div className="flex overflow-x-auto gap-3 pb-2 snap-x scroll-smooth px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div
                              className={`snap-center shrink-0 w-24 h-28 p-2 cursor-pointer transition-all rounded-2xl border flex flex-col items-center justify-start gap-1 pt-3 ${selectedStaffId === undefined ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 bg-muted/10 hover:bg-muted/30'}`}
                              onClick={() => form.setValue(`selections.${index}.staffId`, undefined, { shouldValidate: true })}
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-primary font-medium text-sm">?</span>
                              </div>
                              <div className="text-[10px] font-medium text-center leading-tight mt-1">Siapa Saja</div>
                              <div className="text-[8px] text-muted-foreground mt-1 text-center line-clamp-2">Tersedia</div>
                            </div>

                            {eligibleStaffList.length === 0 && (
                               <div className="snap-center shrink-0 w-40 h-28 p-2 border border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center text-center">
                                  <p className="text-[10px] text-muted-foreground">Tidak ada staf dengan role yang sesuai.</p>
                               </div>
                            )}

                            {eligibleStaffList.map((staff: any) => {
                              const busyReason = checkStaffBusy(staff.id, itemStartTime, itemEndTime);
                              const isBusy = !!busyReason;

                              return (
                                <div
                                  key={staff.id}
                                  className={`snap-center shrink-0 w-24 h-28 p-2 transition-all rounded-2xl border flex flex-col items-center justify-start gap-1 pt-3 ${isBusy ? 'opacity-50 cursor-not-allowed bg-muted/20 border-border/30' : selectedStaffId === staff.id ? 'border-primary bg-primary/5 shadow-sm cursor-pointer' : 'border-border/50 bg-muted/10 hover:bg-muted/30 cursor-pointer'}`}
                                  onClick={() => {
                                    if (!isBusy) {
                                      form.setValue(`selections.${index}.staffId`, staff.id, { shouldValidate: true })
                                    }
                                  }}
                                >
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                    <span className="text-muted-foreground font-medium text-sm">
                                      {staff.firstName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-medium text-center leading-tight truncate w-full mt-1">{staff.firstName}</div>
                                  <div className={`text-[8px] mt-1 text-center leading-[10px] line-clamp-2 w-full px-1 ${isBusy ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                    {isBusy ? busyReason : 'Tersedia'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </>
              )}
              {form.formState.errors.selections?.[index]?.serviceId && <p className="text-xs text-destructive ml-2 mt-2">{form.formState.errors.selections[index]?.serviceId?.message}</p>}
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          className="w-full rounded-2xl h-14 border-dashed border-2 border-border/50 hover:bg-muted/30 hover:border-primary/50 text-foreground font-medium tracking-wide flex items-center gap-2 mt-4"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4" /> Tambah Layanan Lagi
        </Button>

        {form.formState.errors.selections?.root && (
          <p className="text-sm text-destructive text-center mt-2">{form.formState.errors.selections.root.message}</p>
        )}
      </div>
    </div>
  );
}
