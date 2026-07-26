"use client"

import { useExpenseForm } from "../hooks/use-expense-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ExpenseForm({ branchId, accounts, onSuccess }: { branchId: string, accounts: any[], onSuccess?: () => void }) {
  const { form, onSubmit, isSubmitting, error } = useExpenseForm(branchId, onSuccess)

  const assetAccounts = accounts.filter(a => a.type === "ASSET" || a.type === "LIABILITY")
  const expenseAccounts = accounts.filter(a => a.type === "EXPENSE")

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="expenseAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori Pengeluaran</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis pengeluaran" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assetAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dibayar Dari</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sumber dana" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assetAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
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
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Input placeholder="cth: Pembayaran listrik bulan ini" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>No Referensi / Struk (Opsional)</FormLabel>
              <FormControl>
                <Input placeholder="cth: INV-123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <p className="text-red-500 font-medium">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Menyimpan..." : "Catat Pengeluaran"}
        </Button>
      </form>
    </Form>
  )
}
