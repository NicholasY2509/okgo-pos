"use client";

import { useBrandSetting } from "../hooks/use-brand-setting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandSettingInput } from "../schemas/brand-setting";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface BrandSettingFormProps {
  initialData?: BrandSettingInput;
}

export function BrandSettingForm({ initialData }: BrandSettingFormProps) {
  const { form, onSubmit, isSubmitting, error } = useBrandSetting({ initialData });

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
