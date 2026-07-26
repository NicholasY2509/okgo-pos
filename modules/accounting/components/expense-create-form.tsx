"use client"

import { useExpenseForm } from "../hooks/use-expense-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NumericFormat } from "react-number-format"

import { PageHeader } from "@/components/page-header"
import { DatePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { CoaCombobox } from "@/modules/accounting/components/coa-combobox"

export function ExpenseCreateForm({ branchId, accounts }: { branchId: string, accounts: any[] }) {
  const router = useRouter()
  const returnUrl = branchId === "admin" ? "/admin/accounting/expenses" : `/${branchId}/accounting/expenses`

  const { form, onSubmit, isSubmitting, error } = useExpenseForm(branchId, () => {
    router.push(returnUrl)
  })

  const assetAccounts = accounts.filter(a => a.type === "ASSET" || a.type === "LIABILITY")
  const expenseAccounts = accounts.filter(a => a.type === "EXPENSE")

  return (
    <div className="flex flex-col w-full gap-6">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="-ml-2 h-8 w-8">
              <Link href={returnUrl}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span>Catat Pengeluaran</span>
          </div>
        }
        description="Catat pengeluaran operasional baru ke dalam buku besar."
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardContent className="">
              <div className="grid grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tanggal Transaksi</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          setDate={field.onChange}
                          className="bg-muted/30"
                        />
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
                      <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Jumlah</FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="Rp "
                          className="h-10 text-right font-mono bg-muted/30"
                          placeholder="Rp 0"
                          onValueChange={(values) => field.onChange(values.floatValue || 0)}
                          value={field.value === 0 ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Kategori Pengeluaran (Akun Beban)</FormLabel>
                      <FormControl>
                        <CoaCombobox
                          accounts={expenseAccounts}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pilih Kategori Pengeluaran"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assetAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dibayar Dari (Sumber Dana)</FormLabel>
                      <FormControl>
                        <CoaCombobox
                          accounts={assetAccounts}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pilih Sumber Dana"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Deskripsi / Keterangan</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Contoh: Pembayaran listrik bulan ini" {...field} className="bg-muted/30 resize-none" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider">No Referensi / Struk (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: INV-12345" {...field} className="bg-muted/30" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {error && <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium">{error}</div>}

              <div className="flex gap-4 mt-8 pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-32"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pengeluaran"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(returnUrl)}
                >
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
