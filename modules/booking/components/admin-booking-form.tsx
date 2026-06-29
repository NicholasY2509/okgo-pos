"use client";

import { useAdminBookingForm } from "../hooks/use-admin-booking-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    services,
    staffList,
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
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2.5">
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

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2.5">
                <FormLabel>Waktu</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedServiceId || loadingSlots || availableSlots.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      {loadingSlots ? (
                        <div className="flex items-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memuat...
                        </div>
                      ) : (
                        <SelectValue placeholder="Pilih jam" />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableSlots.length > 0 ? (
                      availableSlots.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        Penuh
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
