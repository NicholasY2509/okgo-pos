import { getJournalEntriesAction } from "@/modules/accounting/actions/journal-entry-action"
import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { JournalForm } from "@/modules/accounting/components/journal-form"
import { format } from "date-fns"

export default async function JournalPage({ params }: { params: Promise<{ tenant: string }> }) {
  const [entriesResult, accountsResult] = await Promise.all([
    getJournalEntriesAction(),
    getLedgerAccountsAction()
  ])

  const entries = entriesResult.data || []
  const accounts = accountsResult.data || []

  // Default to the first branch of the user, or let it be blank for now
  // For a real app, this should be selected via a UI context.
  const currentBranchId = "default-branch-id" // Replace with real branch context if available

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
        <p className="text-muted-foreground">View and post manual double-entry journals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <JournalForm branchId={currentBranchId} accounts={accounts} />
        </div>
        
        <div className="lg:col-span-2">
          <div className="rounded-md border bg-card">
            <div className="p-4 border-b bg-muted/50 font-medium">Recent Entries</div>
            <div className="divide-y">
              {entries.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No journal entries found.
                </div>
              ) : (
                entries.map((entry: any) => (
                  <div key={entry.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{entry.description}</h4>
                        <div className="text-xs text-muted-foreground space-x-2">
                          <span>{format(new Date(entry.date), "PPP")}</span>
                          {entry.reference && <span>• Ref: {entry.reference}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 bg-muted/30 rounded border p-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b">
                            <th className="pb-1 font-medium">Account</th>
                            <th className="pb-1 text-right font-medium">Debit</th>
                            <th className="pb-1 text-right font-medium">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.lines.map((line: any) => (
                            <tr key={line.id} className="border-b last:border-0">
                              <td className="py-1">
                                {line.ledgerAccount?.code} - {line.ledgerAccount?.name}
                              </td>
                              <td className="py-1 text-right">
                                {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : ''}
                              </td>
                              <td className="py-1 text-right">
                                {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
