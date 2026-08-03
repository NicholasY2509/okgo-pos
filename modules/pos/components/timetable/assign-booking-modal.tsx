"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ProductCombobox } from "@/modules/product/components/product-combobox";
import { StaffCombobox } from "@/modules/staff/components/staff-combobox";
import { assignBookingToTimetableAction } from "@/modules/booking/actions/booking-actions";
import { useTimetableStore } from "../../stores/timetable-store";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const assignSchema = z.object({
  selections: z.array(z.object({
    serviceId: z.string().min(1, "Layanan harus dipilih"),
    staffId: z.string().optional()
  })).min(1, "Minimal pilih 1 layanan")
});

type AssignInput = z.infer<typeof assignSchema>;

export function AssignBookingModal() {
  const { 
    branchId, 
    selectedBookingForAssignment, 
    setSelectedBookingForAssignment, 
    fetchPendingBookings, 
    fetchSessions 
  } = useTimetableStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssignInput>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      selections: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "selections"
  });

  useEffect(() => {
    if (selectedBookingForAssignment) {
      const count = selectedBookingForAssignment.guestCount || 1;
      const defaults = Array(count).fill({ serviceId: "", staffId: undefined });
      form.reset({ selections: defaults });
    }
  }, [selectedBookingForAssignment, form]);

  const onSubmit = async (values: AssignInput) => {
    if (!selectedBookingForAssignment) return;
    setIsSubmitting(true);
    
    try {
      const res = await assignBookingToTimetableAction(selectedBookingForAssignment.id, values.selections);
      if (res.success) {
        toast.success("Booking berhasil ditugaskan ke jadwal");
        fetchPendingBookings();
        fetchSessions();
        setSelectedBookingForAssignment(null);
      } else {
        toast.error(res.error || "Gagal menugaskan booking");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedBookingForAssignment(null);
    }
  };

  const isOpen = !!selectedBookingForAssignment;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tugaskan Booking ke Jadwal</DialogTitle>
          {selectedBookingForAssignment && (
            <DialogDescription>
              {selectedBookingForAssignment.customerName || "Pelanggan"} -{" "}
              {format(new Date(selectedBookingForAssignment.scheduledStartTime), "EEEE, d MMM yyyy HH:mm", { locale: id })} WIB
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Layanan yang Dipilih ({fields.length} orang)</h4>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ serviceId: "", staffId: undefined })}
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Orang
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pengunjung {index + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`selections.${index}.serviceId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Layanan</FormLabel>
                          <FormControl>
                            <ProductCombobox
                              branchId={branchId!}
                              value={field.value || ""}
                              onChange={field.onChange}
                              error={!!form.formState.errors.selections?.[index]?.serviceId}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`selections.${index}.staffId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terapis (Opsional)</FormLabel>
                          <FormControl>
                            <StaffCombobox
                              branchId={branchId!}
                              value={field.value || ""}
                              onChange={(val) => field.onChange(val || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setSelectedBookingForAssignment(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || fields.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Tugaskan ke Jadwal"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
