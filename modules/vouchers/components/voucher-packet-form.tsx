"use client"

import { useVoucherPacket } from "../hooks/use-voucher-packet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { VoucherPacketInput } from "../schemas/voucher-packet"
import { Label } from "@/components/ui/label"
import { Controller } from "react-hook-form"
import { NumericFormat } from "react-number-format"

interface VoucherPacketFormProps {
  productId: string
  initialData?: VoucherPacketInput & { id: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export function VoucherPacketForm({ productId, initialData, onSuccess, onCancel }: VoucherPacketFormProps) {
  const { form, onSubmit, isSubmitting, error } = useVoucherPacket({
    productId,
    initialData,
    onSuccess
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Paket</Label>
        <Input
          id="name"
          placeholder="cth. Paket 6 Sesi"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Kuantitas</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            {...form.register("quantity")}
          />
          {form.formState.errors.quantity && (
            <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Harga</Label>
          <Controller
            control={form.control}
            name="price"
            render={({ field }) => (
              <NumericFormat
                id="price"
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                onValueChange={(values) => {
                  field.onChange(values.floatValue || 0)
                }}
                value={field.value as number | undefined}
              />
            )}
          />
          {form.formState.errors.price && (
            <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Durasi (Bulan - Opsional)</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          placeholder="Biarkan kosong untuk tanpa kadaluarsa"
          {...form.register("duration")}
        />
        {form.formState.errors.duration && (
          <p className="text-sm text-red-500">{form.formState.errors.duration.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch
          id="isActive"
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", checked)}
        />
        <Label htmlFor="isActive">Aktif</Label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : (initialData ? "Perbarui Paket" : "Buat Paket")}
        </Button>
      </div>
    </form>
  )
}
