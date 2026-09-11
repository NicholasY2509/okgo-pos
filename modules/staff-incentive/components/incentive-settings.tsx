"use client";

import { useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIncentiveRuleForm } from "../hooks/use-incentive-rule";
import { Badge } from "@/components/ui/badge";
import { Controller } from "react-hook-form";
import { NumericFormat } from "react-number-format";

export function IncentiveSettings({ workPositions, initialRules }: { workPositions: any[], initialRules: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight ">Aturan Insentif</h2>
          <p className="text-sm">
            Konfigurasi persentase atau nominal insentif berdasarkan posisi kerja.
          </p>
        </div>
        <Button onClick={() => { setEditingRule(null); setIsOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Aturan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialRules.map((rule) => {
          const wp = workPositions.find(w => w.id === rule.targetWorkPositionId);
          return (
            <Card key={rule.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rule.targetWorkPositions?.map((wp: any) => (
                      <Badge key={wp.id} variant="secondary" className="text-xs">{wp.name}</Badge>
                    ))}
                  </div>
                </div>
                <Badge variant={rule.isActive ? "default" : "secondary"}>
                  {rule.isActive ? "Aktif" : "Non-aktif"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm mb-4">
                  <span className="font-semibold">Tipe: </span>
                  {rule.ruleType === "SERVICE_PRICE_PERCENTAGE" && "Persentase Harga Layanan"}
                  {rule.ruleType === "VOUCHER_SALES_TIERED" && "Tier Penjualan Voucher"}
                  {rule.ruleType === "TOTAL_SALES_TIERED" && "Tier Total Penjualan"}
                  {rule.ruleType === "FIXED_AMOUNT" && "Nominal Tetap"}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingRule(rule); setIsOpen(true); }}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {initialRules.length === 0 && (
          <div className="col-span-full p-8 text-center border rounded-xl text-slate-500 border-dashed">
            Belum ada aturan insentif yang dikonfigurasi.
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Aturan Insentif" : "Tambah Aturan Insentif"}</DialogTitle>
            <DialogDescription>
              Atur nominal atau persentase komisi berdasarkan target penjualan atau layanan.
            </DialogDescription>
          </DialogHeader>

          <IncentiveRuleForm
            initialData={editingRule}
            workPositions={workPositions}
            onSuccess={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IncentiveRuleForm({ initialData, workPositions, onSuccess }: { initialData: any, workPositions: any[], onSuccess: () => void }) {
  const { form, onSubmit, isSubmitting, onDelete, isDeleting, error } = useIncentiveRuleForm(initialData, onSuccess);
  const ruleType = form.watch("ruleType");
  const tiers = form.watch("tiers") || [];

  const addTier = () => {
    const current = form.getValues("tiers") || [];
    form.setValue("tiers", [...current, { minTarget: 0, maxTarget: null, amount: null, percentage: null }]);
  };

  const removeTier = (index: number) => {
    const current = form.getValues("tiers") || [];
    form.setValue("tiers", current.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nama Aturan</Label>
          <Input {...form.register("name")} placeholder="Contoh: Komisi Terapis 10%" />
          {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Posisi Kerja</Label>
          <div className="flex flex-wrap gap-2">
            {workPositions.map(wp => {
              const isSelected = form.watch("targetWorkPositionIds")?.includes(wp.id);
              return (
                <Badge
                  key={wp.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const current = form.watch("targetWorkPositionIds") || [];
                    if (isSelected) {
                      form.setValue("targetWorkPositionIds", current.filter((id: string) => id !== wp.id));
                    } else {
                      form.setValue("targetWorkPositionIds", [...current, wp.id]);
                    }
                  }}
                >
                  {wp.name}
                </Badge>
              );
            })}
          </div>
          {form.formState.errors.targetWorkPositionIds && <p className="text-red-500 text-sm">{form.formState.errors.targetWorkPositionIds.message as string}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipe Aturan</Label>
        <Select
          value={ruleType}
          onValueChange={(v: any) => form.setValue("ruleType", v)}
        >
          <SelectTrigger><SelectValue placeholder="Pilih Tipe Aturan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="FIXED_AMOUNT">Nominal Tetap</SelectItem>
            <SelectItem value="SERVICE_PRICE_PERCENTAGE">Persentase Harga Layanan</SelectItem>
            <SelectItem value="VOUCHER_SALES_TIERED">Tier Penjualan Voucher</SelectItem>
            <SelectItem value="TOTAL_SALES_TIERED">Tier Total Penjualan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {ruleType === "FIXED_AMOUNT" && (
        <div className="space-y-2">
          <Label>Nominal Komisi (Rp)</Label>
          <Controller
            name="flatAmount"
            control={form.control}
            render={({ field }) => (
              <NumericFormat
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                valueIsNumericString
                onValueChange={(values) => {
                  field.onChange(values.floatValue ?? null);
                }}
                value={field.value || ""}
              />
            )}
          />
        </div>
      )}

      {ruleType === "SERVICE_PRICE_PERCENTAGE" && (
        <div className="space-y-2">
          <Label>Persentase Komisi (%)</Label>
          <Input type="number" step="0.01" {...form.register("flatPercentage")} />
          <p className="text-xs text-gray-500">Dihitung dari harga layanan setelah diskon.</p>
        </div>
      )}

      {(ruleType === "VOUCHER_SALES_TIERED" || ruleType === "TOTAL_SALES_TIERED") && (
        <div className="space-y-4 border p-4 rounded-md">
          <div className="flex justify-between items-center">
            <Label>Konfigurasi Tier</Label>
            <Button type="button" variant="outline" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4 mr-2" /> Tambah Tier
            </Button>
          </div>

          {tiers.length === 0 && <p className="text-sm text-gray-500">Belum ada tier. Tambahkan tier untuk menghitung komisi.</p>}

          {tiers.map((tier, index) => (
            <div key={index} className="grid grid-cols-5 gap-2 items-end border-b pb-4 mb-4">
              <div className="col-span-1 space-y-1">
                <Label className="text-xs">Target Min (Rp)</Label>
                <Controller
                  name={`tiers.${index}.minTarget` as const}
                  control={form.control}
                  render={({ field }) => (
                    <NumericFormat
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                      valueIsNumericString
                      onValueChange={(values) => {
                        field.onChange(values.floatValue ?? 0);
                      }}
                      value={field.value || ""}
                    />
                  )}
                />
              </div>
              <div className="col-span-1 space-y-1">
                <Label className="text-xs">Target Max (Rp)</Label>
                <Controller
                  name={`tiers.${index}.maxTarget` as const}
                  control={form.control}
                  render={({ field }) => (
                    <NumericFormat
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                      placeholder="Tak terhingga"
                      valueIsNumericString
                      onValueChange={(values) => {
                        field.onChange(values.floatValue ?? null);
                      }}
                      value={field.value || ""}
                    />
                  )}
                />
              </div>
              <div className="col-span-1 space-y-1">
                <Label className="text-xs">Bonus (Rp)</Label>
                <Controller
                  name={`tiers.${index}.amount` as const}
                  control={form.control}
                  render={({ field }) => (
                    <NumericFormat
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                      placeholder="Atau %"
                      valueIsNumericString
                      onValueChange={(values) => {
                        field.onChange(values.floatValue ?? null);
                      }}
                      value={field.value || ""}
                    />
                  )}
                />
              </div>
              <div className="col-span-1 space-y-1">
                <Label className="text-xs">Bonus (%)</Label>
                <Input type="number" step="0.01" placeholder="Atau Rp" {...form.register(`tiers.${index}.percentage`)} />
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" className="text-red-500 w-full" onClick={() => removeTier(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

      <div className="flex justify-between pt-4">
        {initialData?.id ? (
          <Button type="button" variant="destructive" onClick={() => onDelete(initialData.id)} disabled={isDeleting || isSubmitting}>
            {isDeleting ? "Menghapus..." : "Hapus Aturan"}
          </Button>
        ) : <div />}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Aturan"}
        </Button>
      </div>
    </form>
  );
}
