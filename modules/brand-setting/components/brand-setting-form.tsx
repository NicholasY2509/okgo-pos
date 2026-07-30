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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jam Operasional</CardTitle>
        <CardDescription>Atur jam mulai dan selesai operasional untuk timetable dan booking.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="businessStartTime">Jam Mulai</Label>
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
            <Label htmlFor="businessEndTime">Jam Selesai</Label>
            <Input
              id="businessEndTime"
              type="time"
              {...form.register("businessEndTime")}
            />
            {form.formState.errors.businessEndTime && (
              <p className="text-sm text-red-500">{form.formState.errors.businessEndTime.message}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
