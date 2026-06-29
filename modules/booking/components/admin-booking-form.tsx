"use client";

import { useAdminBookingForm } from "../hooks/use-admin-booking-form";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CustomerSelector } from "../../pos/components/customer-selector";
import { ProductCombobox } from "../../product/components/product-combobox";
import { StaffCombobox } from "../../staff/components/staff-combobox";

interface AdminBookingFormProps {
  branchId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdminBookingForm({ branchId, onSuccess, onCancel }: AdminBookingFormProps) {
  const {
    form,
    onSubmit,
    isSubmitting,
    loadingInitial,
    loadingSlots,
    availableSlots,
    selectedDate,
    selectedServiceId
  } = useAdminBookingForm({ branchId, onSuccess });

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

            <FormField
              control={form.control}
              name="selections.0.serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Layanan</FormLabel>
                  <FormControl>
                    <ProductCombobox
                      branchId={branchId}
                      value={field.value}
                      onChange={field.onChange}
                      error={!!form.formState.errors.selections?.[0]?.serviceId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="selections.0.staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terapis (Opsional)</FormLabel>
                  <FormControl>
                    <StaffCombobox
                      branchId={branchId}
                      value={field.value || ""}
                      onChange={(val) => field.onChange(val || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                ) : !selectedServiceId ? (
                  <div className="h-full flex items-center justify-center text-center bg-muted/10 border border-border/30 rounded-2xl">
                    <p className="text-muted-foreground font-light text-sm">Pilih layanan terlebih dahulu.</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center bg-muted/10 border border-border/30 rounded-2xl">
                    <p className="text-muted-foreground font-light text-sm">Tidak ada jadwal tersedia di tanggal ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 h-full overflow-y-auto pr-2 pb-2 content-start">
                    {availableSlots.map(slot => {
                      const dateObj = new Date(slot);
                      const timeString = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      const isSelected = form.watch("startTime") === slot;
                      return (
                        <div
                          key={slot}
                          className={cn(
                            "py-4 text-center cursor-pointer transition-all rounded-2xl border font-medium text-sm",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-md"
                              : "border-border/50 bg-muted/10 hover:bg-muted/30 text-foreground"
                          )}
                          onClick={() => form.setValue("startTime", slot, { shouldValidate: true })}
                        >
                          {timeString}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {form.formState.errors.startTime && <p className="text-xs text-destructive ml-2 mt-1">{form.formState.errors.startTime.message}</p>}
            </div>
          </div>
        </div>

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
    </Form>
  );
}
