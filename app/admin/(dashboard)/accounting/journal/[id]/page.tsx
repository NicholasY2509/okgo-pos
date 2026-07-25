import { getJournalEntryByIdAction } from "@/modules/accounting/actions/journal-entry-action"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"

export default async function AdminJournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const result = await getJournalEntryByIdAction(id)
  const entry = result.data

  if (!entry) return notFound()

  const totalDebit = entry.lines.reduce((acc: number, line: any) => acc + Number(line.debit), 0)
  const totalCredit = entry.lines.reduce((acc: number, line: any) => acc + Number(line.credit), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="-ml-2 h-8 w-8">
              <Link href="/admin/accounting/journal">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span>Detail Jurnal (Admin)</span>
          </div>
        }
        description={`Melihat rincian jurnal ${entry.reference || ''}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 rounded-md border bg-card">
          <div className="p-4 border-b bg-muted/50 font-medium">Informasi Jurnal</div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Nomor Referensi</div>
              <div className="font-mono mt-1">{entry.reference || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Tanggal</div>
              <div className="mt-1">{format(new Date(entry.date), "dd MMMM yyyy")}</div>
            </div>
            <div className="col-span-2 mt-2">
              <div className="text-sm font-medium text-muted-foreground">Deskripsi</div>
              <div className="mt-1">{entry.description || "-"}</div>
            </div>
            {entry.branchId && (
              <div className="col-span-2 mt-2">
                <div className="text-sm font-medium text-muted-foreground">Cabang</div>
                <div className="mt-1 font-mono">{entry.branchId}</div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1 rounded-md border bg-card">
          <div className="p-4 border-b bg-muted/50 font-medium">Ringkasan</div>
          <div className="p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Debit</span>
              <span className="font-medium">{totalDebit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Kredit</span>
              <span className="font-medium">{totalCredit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/20 text-destructive'}`}>
                {isBalanced ? 'Balanced' : 'Unbalanced'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <div className="p-4 border-b bg-muted/50 font-medium grid grid-cols-4 gap-4">
          <div className="col-span-2">Akun (Buku Besar)</div>
          <div className="text-right">Debit</div>
          <div className="text-right">Kredit</div>
        </div>
        <div className="divide-y">
          {entry.lines.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Tidak ada item jurnal.
            </div>
          ) : (
            entry.lines.map((line: any) => (
              <div key={line.id} className="p-4 grid grid-cols-4 gap-4 items-center hover:bg-muted/30 transition-colors">
                <div className="col-span-2">
                  <div className="font-medium flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{line.ledgerAccount?.code}</span>
                    {line.ledgerAccount?.name}
                  </div>
                </div>
                <div className="text-right font-medium">
                  {Number(line.debit) > 0 ? Number(line.debit).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : "-"}
                </div>
                <div className="text-right font-medium">
                  {Number(line.credit) > 0 ? Number(line.credit).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : "-"}
                </div>
              </div>
            ))
          )}
          {entry.lines.length > 0 && (
            <div className="p-4 grid grid-cols-4 gap-4 items-center bg-muted/50 font-semibold border-t-2">
              <div className="col-span-2 text-right text-muted-foreground">Total:</div>
              <div className="text-right">
                {totalDebit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
              </div>
              <div className="text-right">
                {totalCredit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
