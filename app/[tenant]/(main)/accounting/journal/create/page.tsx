import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { JournalCreateForm } from "@/modules/accounting/components/journal-create-form"

export default async function CreateJournalPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params

  const accountsResult = await getLedgerAccountsAction()
  const accounts = accountsResult.data || []

  return (
    <div className="min-h-screen flex flex-col">
      <JournalCreateForm branchId={tenant} accounts={accounts} />
    </div>
  )
}
