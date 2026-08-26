"use client";

import { useState } from "react";
import { useGenerateBatchPayroll } from "../hooks/use-payroll";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MonthPicker } from "@/components/ui/month-picker";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";

export function GeneratePayrollDialog() {
  const [open, setOpen] = useState(false);
  const { form, onSubmit, isSubmitting } = useGenerateBatchPayroll(() => setOpen(false));

  const handleMonthChange = (val: string) => {
    form.setValue("monthPeriod", val);
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      form.setValue("startDate", range.from);
    }
    if (range?.to) {
      form.setValue("endDate", range.to);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Buat Penggajian</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Buat Penggajian Massal</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            
            <FormField
              control={form.control}
              name="monthPeriod"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Bulan Penggajian</FormLabel>
                  <FormControl>
                    <MonthPicker
                      value={field.value}
                      onChange={handleMonthChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem className="flex flex-col">
              <FormLabel>Periode Penggajian</FormLabel>
              <DatePickerWithRange
                date={{
                  from: form.watch("startDate"),
                  to: form.watch("endDate"),
                }}
                setDate={handleDateRangeChange}
              />
              {!form.watch("startDate") && form.formState.isSubmitted && (
                <p className="text-sm font-medium text-destructive">Tanggal mulai wajib diisi</p>
              )}
              {!form.watch("endDate") && form.formState.isSubmitted && (
                <p className="text-sm font-medium text-destructive">Tanggal akhir wajib diisi</p>
              )}
            </FormItem>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Memproses..." : "Buat Penggajian"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
