"use client";

import { useBrandSetting } from "../hooks/use-brand-setting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandSettingInput } from "../schemas/brand-setting";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { NumericFormat } from "react-number-format";

interface BrandSettingFormProps {
  initialData?: BrandSettingInput;
}

export function BrandSettingForm({ initialData }: BrandSettingFormProps) {
  const { form, onSubmit, isSubmitting, error } = useBrandSetting({ initialData });

  const incentiveType = form.watch("therapistIncentiveType");

  console.log("Form errors:", form.formState.errors);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jam Operasional</CardTitle>
              <CardDescription>Atur jam mulai dan selesai operasional untuk timetable dan booking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessStartTime">Jam Mulai Operasional</Label>
                <Input
                  id="businessStartTime"
                  type="time"
                  {...form.register("businessStartTime")}
                />
                {form.formState.errors.businessStartTime && (
                  <p className="text-sm text-red-500">{form.formState.errors.businessStartTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEndTime">Jam Selesai Operasional</Label>
                <Input
                  id="businessEndTime"
                  type="time"
                  {...form.register("businessEndTime")}
                />
                {form.formState.errors.businessEndTime && (
                  <p className="text-sm text-red-500">{form.formState.errors.businessEndTime.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insentif Terapis Default</CardTitle>
              <CardDescription>Atur nominal insentif yang akan diberikan kepada terapis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipe Insentif Terapis</Label>
                <Select
                  value={form.watch("therapistIncentiveType")}
                  onValueChange={(val: any) => form.setValue("therapistIncentiveType", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe insentif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Flat Rate (Per Service)</SelectItem>
                    <SelectItem value="DURATION_BASED">Berdasarkan Durasi</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.therapistIncentiveType && (
                  <p className="text-sm text-red-500">{form.formState.errors.therapistIncentiveType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="therapistIncentiveAmount">Nominal Insentif</Label>
                <Controller
                  control={form.control}
                  name="therapistIncentiveAmount"
                  render={({ field: { onChange, value } }) => (
                    <NumericFormat
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                      allowNegative={false}
                      value={value}
                      onValueChange={(values) => {
                        onChange(values.floatValue || 0);
                      }}
                      id="therapistIncentiveAmount"
                    />
                  )}
                />
                {form.formState.errors.therapistIncentiveAmount && (
                  <p className="text-sm text-red-500">{form.formState.errors.therapistIncentiveAmount.message}</p>
                )}
              </div>

              {incentiveType === "DURATION_BASED" && (
                <div className="space-y-2">
                  <Label htmlFor="therapistIncentiveDuration">Durasi Dasar (Menit)</Label>
                  <Input
                    id="therapistIncentiveDuration"
                    type="number"
                    min="1"
                    {...form.register("therapistIncentiveDuration", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-gray-500">Insentif akan dikalikan kelipatan durasi ini (misal: layanan 120 menit dengan durasi dasar 60 menit akan mendapatkan 2x nominal insentif).</p>
                  {form.formState.errors.therapistIncentiveDuration && (
                    <p className="text-sm text-red-500">{form.formState.errors.therapistIncentiveDuration.message}</p>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded-md mb-2">
            Form Errors: {JSON.stringify(form.formState.errors)}
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </div>
    </form>
  );
}
