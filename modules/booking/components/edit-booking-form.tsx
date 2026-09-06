
"use client";

import { useEditBookingForm } from "../hooks/use-edit-booking-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Plus, Trash2, Ticket } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFieldArray } from "react-hook-form";
import { CustomerSelector } from "../../pos/components/customer-selector";
import { ProductCombobox } from "../../product/components/product-combobox";
import { StaffCombobox } from "../../staff/components/staff-combobox";

interface EditBookingFormProps {
  branchId: string;
  booking: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditBookingForm({ branchId, booking, onSuccess, onCancel }: EditBookingFormProps) {
  const {
    form,
    onSubmit,
    isSubmitting,
    loadingInitial,

    selectedDate,
  } = useEditBookingForm({ branchId, booking, onSuccess });

  const [showVoucher, setShowVoucher] = useState(!!booking?.appliedVoucher);
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "selections"
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          "w-full justify-start text-left font-normal mt-0.5",
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
        </div>

        <div className="space-y-4 pt-2 border-t">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => {
              // Convert ISO string to HH:mm for the time input
              const timeValue = field.value && !isNaN(new Date(field.value).getTime()) 
                ? format(new Date(field.value), "HH:mm") 
                : "";

              return (
                <FormItem className="flex flex-col md:w-1/2">
                  <FormLabel>Waktu</FormLabel>
                  <FormControl>
                    <TimePicker 
                      variant="minutes"
                      value={timeValue}
                      onChange={(newTime) => {
                        if (!newTime || !selectedDate) return;
                        // Combine selectedDate (YYYY-MM-DD) and newTime (HH:mm) into an ISO string
                        const isoString = new Date(`${selectedDate}T${newTime}:00`).toISOString();
                        field.onChange(isoString);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base font-semibold">Layanan & Terapis</FormLabel>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => append({ serviceId: "", staffId: undefined })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Layanan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-xl space-y-4 relative bg-muted/5">
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                
                <FormField
                  control={form.control}
                  name={`selections.${index}.serviceId` as const}
                  render={({ field: sf }) => (
                    <FormItem>
                      <FormLabel>Layanan {index + 1}</FormLabel>
                      <FormControl>
                        <ProductCombobox
                          branchId={branchId}
                          value={sf.value || ""}
                          onChange={sf.onChange}
                          error={!!form.formState.errors.selections?.[index]?.serviceId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`selections.${index}.staffId` as const}
                  render={({ field: sf }) => {
                    const currentServiceId = form.watch(`selections.${index}.serviceId`);
                    return (
                      <FormItem>
                        <FormLabel>Terapis (Opsional)</FormLabel>
                        <FormControl>
                          <StaffCombobox
                            branchId={branchId}
                            serviceId={currentServiceId}
                            value={sf.value || ""}
                            onChange={(val) => sf.onChange(val || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                
                {(() => {
                  const voucherCode = form.watch(`selections.${index}.appliedVoucherCode`);
                  if (!voucherCode) return null;
                  return (
                    <div className="flex justify-between items-center bg-primary/5 text-primary text-xs px-3 py-2 rounded-md border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        <span>Voucher Layanan: <b>{voucherCode}</b></span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          form.setValue(`selections.${index}.appliedVoucherId`, undefined, { shouldValidate: true });
                          form.setValue(`selections.${index}.appliedVoucherCode`, undefined, { shouldValidate: true });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
        </div>


        {showVoucher && booking.appliedVoucher && (
          <div className="pt-4 border-t space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Voucher Digunakan</h4>
            <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-xl p-3">
               <div className="flex items-center gap-3">
                 <div className="bg-primary/20 p-2 rounded-full text-primary">
                   <Ticket className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-sm font-medium">{booking.appliedVoucher.code}</p>
                   <p className="text-xs text-muted-foreground">
                     {booking.appliedVoucher.voucherPacket?.product ? `Layanan (${booking.appliedVoucher.voucherPacket.product.name})` : 'Potongan Nominal'}
                   </p>
                 </div>
               </div>
               
               <FormField
                 control={form.control}
                 name="appliedVoucherId"
                 render={({ field }) => (
                   <Button 
                     type="button" 
                     variant="ghost" 
                     size="sm" 
                     className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs h-8"
                     onClick={() => {
                       field.onChange("");
                       setShowVoucher(false);
                     }}
                   >
                     Hapus Voucher
                   </Button>
                 )}
               />
            </div>
          </div>
        )}

        <div className="pt-4 mt-2 flex justify-end gap-2 border-t">
          {onCancel && (
            <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting} className="mt-4">
              Batal
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="mt-4">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Form>
  );
}
