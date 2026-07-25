"use client"

import { useLedgerAccountForm } from "../hooks/use-ledger-account"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CoaForm({ branchId, initialData, onSuccess }: { branchId: string, initialData?: any, onSuccess?: () => void }) {
  const { form, onSubmit, isSubmitting } = useLedgerAccountForm(initialData, onSuccess)

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Akun</FormLabel>
                <FormControl>
                  <Input placeholder="cth: 1100" {...field} disabled={!!initialData?.isLocked} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Akun</FormLabel>
                <FormControl>
                  <Input placeholder="cth: Kas" {...field} disabled={!!initialData?.isLocked} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Akun</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData?.isLocked}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ASSET">Aset</SelectItem>
                  <SelectItem value="LIABILITY">Liabilitas</SelectItem>
                  <SelectItem value="EQUITY">Ekuitas</SelectItem>
                  <SelectItem value="REVENUE">Pendapatan</SelectItem>
                  <SelectItem value="EXPENSE">Beban</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi (Opsional)</FormLabel>
              <FormControl>
                <Input placeholder="Deskripsi..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Akun"}
        </Button>
      </form>
    </Form>
  )
}
