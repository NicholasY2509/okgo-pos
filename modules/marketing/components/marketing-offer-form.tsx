"use client"

import { useMarketingOffer } from "../hooks/use-marketing-offer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MarketingOfferInput } from "../schemas/marketing-offer"
import { Controller } from "react-hook-form"
import { NumericFormat } from "react-number-format"

interface MarketingOfferFormProps {
  initialData?: MarketingOfferInput & { id: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export function MarketingOfferForm({ initialData, onSuccess, onCancel }: MarketingOfferFormProps) {
  const { form, onSubmit, isSubmitting, error } = useMarketingOffer({ initialData, onSuccess })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Judul Penawaran</Label>
        <Input
          id="title"
          placeholder="cth. 10 Sesi Massage"
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          placeholder="cth. Nikmati 10x sesi Full Body Massage (60 Menit)..."
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="features">Fitur/Benefit (pisahkan dengan baris baru)</Label>
        <Textarea
          id="features"
          placeholder="Bebas pilih jadwal&#10;Bebas pilih spesialis Terapis"
          {...form.register("features")}
          rows={4}
        />
        {form.formState.errors.features && (
          <p className="text-sm text-red-500">{form.formState.errors.features.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="normalPrice">Harga Normal (Opsional)</Label>
          <Controller
            control={form.control}
            name="normalPrice"
            render={({ field }) => (
              <NumericFormat
                id="normalPrice"
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                onValueChange={(values) => field.onChange(values.floatValue || null)}
                value={field.value as number | undefined}
              />
            )}
          />
          {form.formState.errors.normalPrice && (
            <p className="text-sm text-red-500">{form.formState.errors.normalPrice.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountPrice">Harga Promo</Label>
          <Controller
            control={form.control}
            name="discountPrice"
            render={({ field }) => (
              <NumericFormat
                id="discountPrice"
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                onValueChange={(values) => field.onChange(values.floatValue || 0)}
                value={field.value as number | undefined}
              />
            )}
          />
          {form.formState.errors.discountPrice && (
            <p className="text-sm text-red-500">{form.formState.errors.discountPrice.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="order">Urutan Tampil (Opsional)</Label>
        <Input
          id="order"
          type="number"
          placeholder="0"
          {...form.register("order")}
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch
          id="isActive"
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", checked)}
        />
        <Label htmlFor="isActive">Aktif (Tampilkan di halaman utama)</Label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : (initialData ? "Perbarui" : "Buat Penawaran")}
        </Button>
      </div>
    </form>
  )
}
