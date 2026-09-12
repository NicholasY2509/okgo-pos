import { getJournalEntriesByAccountAction } from "@/modules/accounting/actions/journal-entry-action"
import { LedgerAccountService } from "@/modules/accounting/services/ledger-account-service"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"

export default async function AdminAccountLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const account = await LedgerAccountService.getById(id)
  if (!account) return notFound()

  const result = await getJournalEntriesByAccountAction(id)
  const entries = result.data || []

  // Calculate a running balance
  // Since entries are sorted descending by date, we'll process them in reverse to get running balance
  let runningBalance = 0;
  const isAssetOrExpense = account.type === 'ASSET' || account.type === 'EXPENSE';

  const processedEntries = [...entries].reverse().map(entry => {
    // Find the specific line for this account
    const line = entry.lines.find((l: any) => l.ledgerAccountId === id);
    if (!line) return { ...entry, lineDebit: 0, lineCredit: 0, balance: runningBalance };

    const debit = Number(line.debit);
    const credit = Number(line.credit);

    if (isAssetOrExpense) {
      runningBalance += debit - credit;
    } else {
      runningBalance += credit - debit;
    }

    return {
      ...entry,
      lineDebit: debit,
      lineCredit: credit,
      balance: runningBalance
    }
  }).reverse(); // Reverse back for descending display

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="-ml-2 h-8 w-8">
              <Link href="/admin/accounting/coa">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span>Buku Besar: {account.code} - {account.name}</span>
          </div>
        }
        description={`Melihat semua transaksi untuk akun ${account.type.toLowerCase()} ini.`}
      />

      <div className="rounded-md border bg-card">
        <div className="p-4 border-b bg-muted/50 font-medium grid grid-cols-6 gap-4">
          <div>Tanggal</div>
          <div className="col-span-2">Deskripsi</div>
          <div className="text-right">Debit</div>
          <div className="text-right">Kredit</div>
          <div className="text-right">Saldo</div>
        </div>
        <div className="divide-y">
          {processedEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Tidak ada transaksi yang tercatat untuk akun ini.
            </div>
          ) : (
            processedEntries.map((entry: any) => (
              <div key={entry.id} className="p-4 grid grid-cols-6 gap-4 items-center">
                <div className="text-sm">
                  {format(new Date(entry.date), "dd MMM yyyy")}
                </div>
                <div className="col-span-2 font-medium">
                  {entry.description}
                  {entry.reference && <div className="text-xs text-muted-foreground font-mono">Ref: {entry.reference}</div>}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {entry.lineDebit > 0 ? entry.lineDebit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : "-"}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {entry.lineCredit > 0 ? entry.lineCredit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : "-"}
                </div>
                <div className="text-right font-medium">
                  {entry.balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
