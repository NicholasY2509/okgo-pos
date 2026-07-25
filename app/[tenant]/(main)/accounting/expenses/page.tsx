import { getExpenseEntriesAction } from "@/modules/accounting/actions/journal-entry-action"
import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { ExpenseFormDialog } from "@/modules/accounting/components/expense-form-dialog"
import { format } from "date-fns"
import { PageHeader } from "@/components/page-header"

export default async function ExpensesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  
  // Fetch only expense-related journal entries
  const entriesResult = await getExpenseEntriesAction(tenant)
  const entries = entriesResult.data || []

  // Fetch all accounts to pass into the Expense form
  const accountsResult = await getLedgerAccountsAction()
  const accounts = accountsResult.data || []

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Pengeluaran"
        description={`Catat dan pantau pengeluaran operasional untuk cabang ${tenant}.`}
      >
        <ExpenseFormDialog branchId={tenant} accounts={accounts} />
      </PageHeader>

      <div className="rounded-md border bg-card">
        <div className="p-4 border-b bg-muted/50 font-medium grid grid-cols-6 gap-4">
          <div>Tanggal</div>
          <div className="col-span-2">Deskripsi / Ref</div>
          <div>Akun Beban</div>
          <div>Dibayar Dari</div>
          <div className="text-right">Jumlah</div>
        </div>
        <div className="divide-y">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Belum ada pengeluaran yang dicatat. Klik "Catat Pengeluaran" untuk menambahkan.
            </div>
          ) : (
            entries.map((entry: any) => {
              // Extract the expense line and payment line
              const expenseLine = entry.lines.find((l: any) => l.ledgerAccount.type === 'EXPENSE')
              const paymentLine = entry.lines.find((l: any) => l.ledgerAccount.type !== 'EXPENSE')

              return (
                <div key={entry.id} className="p-4 grid grid-cols-6 gap-4 items-center">
                  <div className="text-sm">
                    {format(new Date(entry.date), "dd MMM yyyy")}
                  </div>
                  <div className="col-span-2">
                    <div className="font-medium">{entry.description}</div>
                    {entry.reference && <div className="text-xs text-muted-foreground font-mono">{entry.reference}</div>}
                  </div>
                  <div className="text-sm font-medium">
                    {expenseLine ? expenseLine.ledgerAccount.name : "-"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {paymentLine ? paymentLine.ledgerAccount.name : "-"}
                  </div>
                  <div className="text-right font-medium">
                    {(expenseLine?.debit || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
