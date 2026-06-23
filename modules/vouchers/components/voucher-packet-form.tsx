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
  productId?: string
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
          placeholder="cth. Paket 6 Sesi / Voucher Rp100rb"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="codeSuffix">Code Suffix (Opsional)</Label>
        <Input
          id="codeSuffix"
          placeholder="cth. PJT, SKS"
          {...form.register("codeSuffix")}
        />
        {form.formState.errors.codeSuffix && (
          <p className="text-sm text-red-500">{form.formState.errors.codeSuffix.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalVisitCount">Jumlah Kunjungan (Opsional)</Label>
          <Input
            id="totalVisitCount"
            type="number"
            min="1"
            placeholder="cth. 10"
            {...form.register("totalVisitCount")}
          />
          {form.formState.errors.totalVisitCount && (
            <p className="text-sm text-red-500">{form.formState.errors.totalVisitCount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalCreditAmount">Jumlah Kredit (Opsional)</Label>
          <Controller
            control={form.control}
            name="totalCreditAmount"
            render={({ field }) => (
              <NumericFormat
                id="totalCreditAmount"
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                placeholder="cth. Rp 500.000"
                onValueChange={(values) => {
                  field.onChange(values.floatValue || null)
                }}
                value={field.value as number | undefined}
              />
            )}
          />
          {form.formState.errors.totalCreditAmount && (
            <p className="text-sm text-red-500">{form.formState.errors.totalCreditAmount.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Harga Jual</Label>
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

      <div className="space-y-2">
        <Label htmlFor="validityDays">Masa Berlaku (Hari - Opsional)</Label>
        <Input
          id="validityDays"
          type="number"
          min="1"
          placeholder="Biarkan kosong untuk tanpa kadaluarsa"
          {...form.register("validityDays")}
        />
        {form.formState.errors.validityDays && (
          <p className="text-sm text-red-500">{form.formState.errors.validityDays.message}</p>
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
      {form.formState.errors.root?.serverError?.message && (
         <p className="text-sm text-red-500">{form.formState.errors.root.serverError.message}</p>
      )}
      {form.formState.errors.totalVisitCount && form.formState.errors.totalCreditAmount && (
          <p className="text-sm text-red-500">Isi salah satu dari Jumlah Kunjungan atau Kredit</p>
      )}

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
