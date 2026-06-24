"use client"

import { useDiscountForm } from "../hooks/use-discount"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Discount } from "../types/discount"

interface DiscountFormProps {
  initialData?: Discount
  branches: { id: string, name: string }[]
  onSuccess?: () => void
}

export function DiscountForm({ initialData, branches, onSuccess }: DiscountFormProps) {
  const { form, onSubmit, isSubmitting, error } = useDiscountForm(initialData, onSuccess)



  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama</Label>
        <Input {...form.register("name")} placeholder="Contoh: Happy Hour" />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Hari</Label>
          <Select
            value={form.watch("dayOfWeek")}
            onValueChange={(val) => form.setValue("dayOfWeek", val as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih hari" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUNDAY">Minggu</SelectItem>
              <SelectItem value="MONDAY">Senin</SelectItem>
              <SelectItem value="TUESDAY">Selasa</SelectItem>
              <SelectItem value="WEDNESDAY">Rabu</SelectItem>
              <SelectItem value="THURSDAY">Kamis</SelectItem>
              <SelectItem value="FRIDAY">Jumat</SelectItem>
              <SelectItem value="SATURDAY">Sabtu</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.dayOfWeek && (
            <p className="text-sm text-red-500">{form.formState.errors.dayOfWeek.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Persentase Diskon (%)</Label>
          <Input type="number" step="0.01" {...form.register("percentage")} />
          {form.formState.errors.percentage && (
            <p className="text-sm text-red-500">{form.formState.errors.percentage.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Waktu Mulai (HH:mm)</Label>
          <Input type="time" {...form.register("startTime")} />
          {form.formState.errors.startTime && (
            <p className="text-sm text-red-500">{form.formState.errors.startTime.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Waktu Selesai (HH:mm)</Label>
          <Input type="time" {...form.register("endTime")} />
          {form.formState.errors.endTime && (
            <p className="text-sm text-red-500">{form.formState.errors.endTime.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cabang (Opsional)</Label>
        <Select
          value={form.watch("branchId") || "all"}
          onValueChange={(val) => form.setValue("branchId", val === "all" ? null : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Universal (Semua Cabang)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Universal (Semua Cabang)</SelectItem>
            {branches.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch
          checked={form.watch("isActive")}
          onCheckedChange={(val) => form.setValue("isActive", val)}
        />
        <Label>Aktif</Label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Diskon"}
        </Button>
      </div>
    </form>
  )
}
