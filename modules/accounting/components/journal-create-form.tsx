"use client"

import { useJournalEntryForm } from "../hooks/use-journal-entry"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowLeft, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NumericFormat } from "react-number-format"

import { PageHeader } from "@/components/page-header"
import { DatePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { CoaCombobox } from "@/modules/accounting/components/coa-combobox"

export function JournalCreateForm({ branchId, accounts }: { branchId: string, accounts: any[] }) {
  const router = useRouter()

  const { form, lineFields, append, remove, onSubmit, isSubmitting, error } = useJournalEntryForm(branchId, () => {
    router.push(`/${branchId}/accounting/journal`)
  })

  // Calculate totals
  const formValues = form.watch()
  const totalDebit = formValues.lines?.filter(l => l.type === 'DEBIT').reduce((acc, l) => acc + (Number(l.amount) || 0), 0) || 0
  const totalCredit = formValues.lines?.filter(l => l.type === 'CREDIT').reduce((acc, l) => acc + (Number(l.amount) || 0), 0) || 0
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001
  const difference = Math.abs(totalDebit - totalCredit)

  return (
    <div className="flex flex-col w-full gap-6">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="-ml-2 h-8 w-8">
              <Link href={`/${branchId}/accounting/journal`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span>Tambah Jurnal</span>
          </div>
        }
        description="Catat transaksi manual ke dalam buku besar."
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-6 relative pb-40">

          <Card className="shadow-sm">
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <FormField
                  control={form.control as any}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tanggal Transaksi</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          className="bg-muted/30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Deskripsi / Keterangan</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Contoh: Saldo Awal, Koreksi Persediaan..." {...field} className="bg-muted/30 resize-none h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center">
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </span>
                Item Jurnal
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium"
                onClick={() => append({ ledgerAccountId: "", type: "DEBIT", amount: 0 })}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Tambah Baris
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="grid grid-cols-[1fr_150px_200px_40px] gap-4 px-6 py-3 border-b bg-muted/5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div>Pilih Akun</div>
                <div>Tipe</div>
                <div>Jumlah</div>
                <div></div>
              </div>

              <div className="divide-y">
                {lineFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_150px_200px_40px] gap-4 px-6 py-4 items-center hover:bg-muted/5 transition-colors group">
                    <FormField
                      control={form.control as any}
                      name={`lines.${index}.ledgerAccountId`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <CoaCombobox
                              accounts={accounts}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Pilih Akun"
                            />
                          </FormControl>
                          <FormMessage className="text-xs absolute" />
                        </FormItem>
                      )}
                    />
                    <div className="col-span-1 w-full">
                      <FormField
                        control={form.control as any}
                        name={`lines.${index}.type`}
                        render={({ field }) => (
                          <FormItem className="space-y-0 w-full">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DEBIT">DEBIT</SelectItem>
                                <SelectItem value="CREDIT">KREDIT</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>



                    <FormField
                      control={form.control as any}
                      name={`lines.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className="space-y-0 relative">
                          <FormControl>
                            <NumericFormat
                              customInput={Input}
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="Rp "
                              className="h-9 text-right font-mono"
                              placeholder="Rp 0"
                              onValueChange={(values) => field.onChange(values.floatValue || 0)}
                              value={field.value === 0 ? "" : field.value}
                            />
                          </FormControl>
                          <FormMessage className="text-xs absolute" />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => remove(index)}
                        disabled={lineFields.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sticky Summary Card */}
          <div className="fixed bottom-6 right-6 w-80">
            <Card className="shadow-lg border-muted">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Total Debit</span>
                    <span className="font-mono font-bold text-foreground">Rp {totalDebit.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Total Kredit</span>
                    <span className="font-mono font-bold text-foreground">Rp {totalCredit.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {!isBalanced && (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 text-sm font-medium p-3 rounded-md border border-destructive/20">
                    <Info className="w-4 h-4 shrink-0" />
                    <div className="flex-1">Tidak Seimbang</div>
                    <div className="font-mono font-bold">-Rp {difference.toLocaleString('id-ID')}</div>
                  </div>
                )}

                {error && <div className="text-xs text-destructive text-center">{error}</div>}

                {form.formState.errors.lines?.root && (
                  <div className="text-xs text-destructive text-center">{form.formState.errors.lines.root.message}</div>
                )}

                <div className="space-y-2 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-[#F4A28C] hover:bg-[#E58C73] text-white"
                    disabled={isSubmitting || !isBalanced}
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Jurnal"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => router.push(`/${branchId}/accounting/journal`)}
                  >
                    Batalkan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  )
}
