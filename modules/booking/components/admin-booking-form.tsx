"use client";

import { useMemo, useState } from "react";
import { useAdminBookingForm } from "../hooks/use-admin-booking-form";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { AlertTriangle, Calendar as CalendarIcon, ChevronRight, Loader2, Plus, Sparkles, Trash2, User } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CustomerSelector } from "../../pos/components/customer-selector";
import { BookingSelectionDialog } from "./booking-selection-dialog";
import type { ServiceOption, StaffOption } from "@/modules/pos/components/selection-panel-lists";

interface AdminBookingFormProps {
  branchId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdminBookingForm({ branchId, onSuccess, onCancel }: AdminBookingFormProps) {
  const {
    form,
    fields,
    append,
    remove,
    onSubmit,
    isSubmitting,
    loadingInitial,
    loadingSlots,
    services,
    staffList,
    availableSlots,
    selectedDate,
    selectedStartTime,
    isBusyStaffSelected,
    confirmBusyStaffOpen,
    setConfirmBusyStaffOpen,
    confirmBusyStaffSubmit,
  } = useAdminBookingForm({ branchId, onSuccess });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const watchedSelections = form.watch("selections");

  const startDateTime = useMemo(() => {
    if (!selectedDate || !selectedStartTime) return undefined;
    return new Date(`${selectedDate}T${selectedStartTime}:00`);
  }, [selectedDate, selectedStartTime]);

  if (loadingInitial) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Pelanggan</FormLabel>
                  <FormControl>
                    <CustomerSelector
                      value={field.value}
                      onChange={(val) => field.onChange(val || "")}
                      error={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <FormLabel>Layanan & Terapis</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ serviceId: "", staffId: undefined })}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Tambah Layanan
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {fields.map((item, index) => {
                  const selection = watchedSelections?.[index];
                  const selectedProduct = (services as ServiceOption[] || []).find(
                    (p) => p.id === selection?.serviceId
                  );
                  const selectedStaff = (staffList as StaffOption[] || []).find(
                    (s) => s.id === selection?.staffId
                  );
                  const serviceError = form.formState.errors.selections?.[index]?.serviceId;

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditingIndex(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setEditingIndex(index);
                        }
                      }}
                      className={cn(
                        "p-3.5 border rounded-xl transition-all cursor-pointer bg-card hover:bg-accent/40 space-y-2.5",
                        serviceError
                          ? "border-destructive ring-1 ring-destructive/30"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Layanan {fields.length > 1 ? index + 1 : ""}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                remove(index);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                        <div className="flex items-start gap-2 min-w-0">
                          <Sparkles className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground">Layanan</p>
                            {selectedProduct ? (
                              <p className="font-medium text-foreground truncate">
                                {selectedProduct.name}
                              </p>
                            ) : (
                              <p
                                className={cn(
                                  "text-xs italic",
                                  serviceError ? "text-destructive" : "text-muted-foreground"
                                )}
                              >
                                Pilih layanan
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2 min-w-0">
                          <User className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground">Terapis</p>
                            <p className="font-medium text-foreground truncate">
                              {selectedStaff
                                ? `${selectedStaff.firstName} ${selectedStaff.lastName}`
                                : "Siapa saja (Opsional)"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(new Date(selectedDate), "PPP") : <span>Pilih Tanggal</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate ? new Date(selectedDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue("date", format(date, "yyyy-MM-dd"), { shouldValidate: true });
                            form.setValue("startTime", ""); // Reset time when date changes
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 pt-2">
              <FormLabel>Waktu Tersedia</FormLabel>
              <div className="h-[280px]">
                {loadingSlots ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground font-light text-xs uppercase tracking-widest">
                    <Loader2 className="w-5 h-5 animate-spin mb-3 opacity-50" />
                    Mencari jadwal kosong...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center bg-muted/10 border border-border/30 rounded-2xl">
                    <p className="text-muted-foreground font-light text-sm">Tidak ada jadwal tersedia di tanggal ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 h-full overflow-y-auto pr-2 pb-2 content-start">
                    {availableSlots.map((slot) => {
                      const dateObj = new Date(slot.time);
                      const timeString = dateObj.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Jakarta'
                      });
                      const isSelected = form.watch("startTime") === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.canFulfill}
                          className={cn(
                            "py-2.5 px-2 text-center transition-all rounded-xl border flex flex-col items-center justify-center gap-0.5",
                            !slot.canFulfill
                              ? "border-border/40 bg-muted/30 text-muted-foreground opacity-65 cursor-not-allowed"
                              : isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-md cursor-pointer"
                                : "border-border/60 bg-muted/10 hover:bg-muted/30 text-foreground cursor-pointer"
                          )}
                          onClick={() => {
                            if (!slot.canFulfill) return;
                            form.setValue("startTime", slot.time, { shouldValidate: true });
                          }}
                        >
                          <span className="font-semibold text-sm leading-tight">{timeString}</span>
                          <span
                            className={cn(
                              "text-[11px] leading-tight",
                              isSelected
                                ? "text-primary-foreground/90"
                                : !slot.canFulfill
                                  ? "text-destructive font-medium"
                                  : slot.hasBusyStaff
                                    ? "text-amber-600 dark:text-amber-400 font-medium"
                                    : "text-emerald-600 dark:text-emerald-400 font-medium"
                            )}
                          >
                            {slot.availableCount > 0
                              ? slot.hasBusyStaff
                                ? `${slot.availableCount} slot (${slot.reason})`
                                : slot.canFulfill
                                  ? `${slot.availableCount} slot`
                                  : `${slot.availableCount} slot (${slot.reason})`
                              : "Penuh"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {form.formState.errors.startTime && <p className="text-xs text-destructive ml-2 mt-1">{form.formState.errors.startTime.message}</p>}
            </div>
          </div>
        </div>

        {isBusyStaffSelected && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p>
              Peringatan: Terapis yang dipilih sedang sibuk pada jam yang dipilih. Yakin ingin melanjutkan?
            </p>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-2">
          {onCancel && (
            <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
              Batal
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Buat Booking
          </Button>
        </div>
      </form>

      <AlertDialog open={confirmBusyStaffOpen} onOpenChange={setConfirmBusyStaffOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terapis Sibuk pada Jam Terpilih</AlertDialogTitle>
            <AlertDialogDescription>
              Terapis yang Anda pilih sedang melayani atau terjadwal pada jam yang dipilih. Yakin ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBusyStaffSubmit}>
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingIndex !== null && watchedSelections?.[editingIndex] && (
        <BookingSelectionDialog
          key={`booking-selection-${editingIndex}`}
          open={editingIndex !== null}
          index={editingIndex}
          totalCount={fields.length}
          branchId={branchId}
          startTime={startDateTime}
          services={services || []}
          staffList={staffList || []}
          initialServiceId={watchedSelections[editingIndex].serviceId || ""}
          initialStaffId={watchedSelections[editingIndex].staffId}
          onClose={() => setEditingIndex(null)}
          onSave={(serviceId, staffId) => {
            form.setValue(`selections.${editingIndex}.serviceId`, serviceId, {
              shouldValidate: true,
            });
            form.setValue(`selections.${editingIndex}.staffId`, staffId);
          }}
        />
      )}
    </Form>
  );
}
