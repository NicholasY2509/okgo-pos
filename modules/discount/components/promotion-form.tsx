"use client"

import { usePromotionForm } from "../hooks/use-promotion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"

interface PromotionFormProps {
  initialData?: any
  branches: { id: string, name: string }[]
  products: { id: string, name: string }[]
  onSuccess?: () => void
}

export function PromotionForm({ initialData, branches, products, onSuccess }: PromotionFormProps) {
  const { 
    form, 
    scheduleFields, 
    appendSchedule, 
    removeSchedule, 
    onSubmit, 
    isSubmitting, 
    error 
  } = usePromotionForm(initialData, onSuccess)

  const rewardType = form.watch("reward.type")

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* 1. General Info */}
      <Card>
        <CardHeader><CardTitle>Informasi Umum</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Promo</Label>
            <Input {...form.register("name")} placeholder="Contoh: Diskon Pagi" />
            {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Deskripsi (Opsional)</Label>
            <Input {...form.register("description")} placeholder="Syarat dan ketentuan singkat..." />
          </div>

          <div className="space-y-2">
            <Label>Cabang</Label>
            <Select
              value={form.watch("branchId") || "all"}
              onValueChange={(val) => form.setValue("branchId", val === "all" ? null : val)}
            >
              <SelectTrigger><SelectValue placeholder="Universal (Semua Cabang)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Universal (Semua Cabang)</SelectItem>
                {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch checked={form.watch("isActive")} onCheckedChange={(val) => form.setValue("isActive", val)} />
            <Label>Promo Aktif</Label>
          </div>
        </CardContent>
      </Card>

          {/* 3. Conditions */}
          <Card>
            <CardHeader><CardTitle>Syarat Keranjang (Opsional)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Minimal Jumlah Layanan di Keranjang</Label>
                <Input type="number" min="1" {...form.register("conditions.minQuantity", { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Wajib Ada Layanan Tertentu?</Label>
                <p className="text-sm text-muted-foreground">Pilih layanan yang harus dibeli agar promo aktif. Biarkan kosong jika berlaku untuk semua.</p>
                {/* Simple multiple select using select, ideally a proper MultiSelect component */}
                <Select
                  value={form.watch("conditions.requiredServiceIds")?.[0] || "none"}
                  onValueChange={(val) => form.setValue("conditions.requiredServiceIds", val === "none" ? [] : [val])}
                >
                  <SelectTrigger><SelectValue placeholder="Semua Layanan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Semua Layanan</SelectItem>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* 4. Reward */}
          <Card>
            <CardHeader><CardTitle>Hadiah Promo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Jenis Promo</Label>
                <Select
                  value={rewardType}
                  onValueChange={(val: any) => form.setValue("reward.type", val)}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE_TOTAL">Diskon % (Total Keranjang)</SelectItem>
                    <SelectItem value="FREE_ADDON">Gratis Layanan Tambahan (Buy 1 Get 1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {rewardType === "PERCENTAGE_TOTAL" && (
                <div className="space-y-2">
                  <Label>Besaran Diskon (%)</Label>
                  <Input type="number" min="0" max="100" {...form.register("reward.value", { valueAsNumber: true })} />
                  {form.formState.errors.reward?.value && <p className="text-sm text-red-500">{form.formState.errors.reward.value.message}</p>}
                </div>
              )}

              {rewardType === "FREE_ADDON" && (
                <div className="space-y-2">
                  <Label>Layanan Gratis yang Didapat</Label>
                  <Select
                    value={form.watch("reward.addonServiceId") || ""}
                    onValueChange={(val) => form.setValue("reward.addonServiceId", val)}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih Layanan Gratis" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.reward?.addonServiceId && <p className="text-sm text-red-500">{form.formState.errors.reward.addonServiceId.message}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Schedules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Jadwal Berlaku</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => appendSchedule({ days: ["MONDAY"], startTime: "09:00", endTime: "22:00" })}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Jadwal
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {scheduleFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md relative space-y-4">
              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500" onClick={() => removeSchedule(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
              
              <div className="space-y-2">
                <Label>Pilih Hari</Label>
                <div className="flex flex-wrap gap-2">
                  {["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map((day) => {
                    const currentDays = form.watch(`schedules.${index}.days`) || []
                    const isSelected = currentDays.includes(day as any)
                    return (
                      <Button
                        key={day}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newDays = isSelected 
                            ? currentDays.filter(d => d !== day)
                            : [...currentDays, day]
                          form.setValue(`schedules.${index}.days`, newDays as any)
                        }}
                      >
                        {day.substring(0, 3)}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Waktu Mulai</Label>
                  <Input type="time" {...form.register(`schedules.${index}.startTime`)} />
                </div>
                <div className="space-y-2">
                  <Label>Waktu Selesai</Label>
                  <Input type="time" {...form.register(`schedules.${index}.endTime`)} />
                </div>
              </div>
            </div>
          ))}
          {form.formState.errors.schedules && <p className="text-sm text-red-500">{form.formState.errors.schedules.message}</p>}
        </CardContent>
      </Card>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Promo"}
        </Button>
      </div>
    </form>
  )
}
