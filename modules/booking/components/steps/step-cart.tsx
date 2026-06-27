import { useState } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { BookingInput } from "../../schemas/booking";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Scissors, User, ChevronDown, ChevronUp, X } from "lucide-react";

interface StepCartProps {
  form: UseFormReturn<BookingInput>;
  services: any[];
  staffList: any[];
  loading: boolean;
}

export function StepCart({ form, services, staffList, loading }: StepCartProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "selections"
  });

  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const handleAdd = () => {
    append({ serviceId: "", staffId: undefined });
    setExpandedIndex(fields.length); // Expand the newly added item
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right-8 fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h2 className="text-3xl font-display font-light tracking-tight">Pilih Layanan</h2>
          <p className="text-muted-foreground font-light text-sm">Pilih treatment dan terapis untuk Anda (dan teman Anda).</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full shadow-sm text-xs font-medium shrink-0"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      {loading && !services.length ? (
        <div className="py-12 text-center text-muted-foreground font-light tracking-widest text-xs uppercase">Memuat data...</div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => {
            const selectedServiceId = form.watch(`selections.${index}.serviceId`);
            const selectedStaffId = form.watch(`selections.${index}.staffId`);

            const selectedService = services.find(s => s.id === selectedServiceId);
            const selectedStaff = staffList.find(s => s.id === selectedStaffId);
            const isExpanded = expandedIndex === index;

            return (
              <div key={field.id} className={`rounded-3xl border transition-all ${isExpanded ? 'border-primary/20 bg-background shadow-md' : 'border-border/50 bg-background/50 shadow-sm hover:border-primary/30'}`}>

                {/* Collapsed Header / Accordion Toggle */}
                <div
                  className={`p-5 md:p-6 flex items-center justify-between cursor-pointer select-none ${isExpanded ? 'border-b border-border/50 bg-muted/5' : ''}`}
                  onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className={`font-medium ${selectedService ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {selectedService ? selectedService.name : `Pilih Layanan ${index + 1}`}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="w-3 h-3" /> {selectedStaff ? selectedStaff.firstName : "Terapis: Siapa Saja"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(index);
                          if (expandedIndex === index) setExpandedIndex(Math.max(0, index - 1));
                        }}
                        className="text-muted-foreground hover:text-destructive h-10 w-10 p-0 rounded-full transition-colors hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/30">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="p-5 md:p-6 space-y-8 pt-0 mt-4 border-t border-border/10">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2">
                          {services.map(service => (
                            <div
                              key={service.id}
                              className={`p-4 cursor-pointer transition-all rounded-2xl border flex flex-col justify-center ${selectedServiceId === service.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 bg-muted/10 hover:bg-muted/30'}`}
                              onClick={() => form.setValue(`selections.${index}.serviceId`, service.id, { shouldValidate: true })}
                            >
                              <div className="font-medium text-foreground text-base mb-1">{service.name}</div>
                              <div className="text-[10px] text-muted-foreground font-light flex justify-between uppercase tracking-widest">
                                <span>{service.duration} mnt</span>
                                <span className="font-medium text-primary">Rp {Number(service.price).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {form.formState.errors.selections?.[index]?.serviceId && <p className="text-xs text-destructive ml-2 mt-1">{form.formState.errors.selections[index]?.serviceId?.message}</p>}
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2 flex items-center gap-2">
                          <User className="w-3 h-3" /> 2. Pilih Terapis (Opsional)
                        </label>
                        <div className="flex overflow-x-auto gap-3 pb-2 snap-x scroll-smooth px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <div
                            className={`snap-center shrink-0 w-24 h-24 p-3 cursor-pointer transition-all rounded-2xl border flex flex-col items-center justify-center gap-2 ${selectedStaffId === undefined ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 bg-muted/10 hover:bg-muted/30'}`}
                            onClick={() => form.setValue(`selections.${index}.staffId`, undefined, { shouldValidate: true })}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-primary font-medium text-sm">?</span>
                            </div>
                            <div className="text-[10px] font-medium text-center leading-tight">Siapa Saja</div>
                          </div>

                          {staffList.map(staff => (
                            <div
                              key={staff.id}
                              className={`snap-center shrink-0 w-24 h-24 p-3 cursor-pointer transition-all rounded-2xl border flex flex-col items-center justify-center gap-2 ${selectedStaffId === staff.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 bg-muted/10 hover:bg-muted/30'}`}
                              onClick={() => form.setValue(`selections.${index}.staffId`, staff.id, { shouldValidate: true })}
                            >
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                <span className="text-muted-foreground font-medium text-sm">
                                  {staff.firstName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="text-[10px] font-medium text-center leading-tight truncate w-full">{staff.firstName}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
      )}
    </div>
  );
}
