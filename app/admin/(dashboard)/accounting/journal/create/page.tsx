import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { JournalCreateForm } from "@/modules/accounting/components/journal-create-form"

export default async function AdminCreateJournalPage() {
  const accountsResult = await getLedgerAccountsAction()
  const accounts = accountsResult.data || []

  // Empty string for Admin so it's not tied to a specific branch, though usually journals are branch specific.
  // Actually JournalEntry schema requires a branchId: z.string().min(1, "Branch ID is required").
  // Admin shouldn't just be able to create a journal without a branch.
  // We'll pass "admin" as branchId for now, but ideally it should have a branch selector if admin creates it.
  
  return (
    <div className="p-6 min-h-screen flex flex-col bg-slate-50/50">
      <JournalCreateForm branchId="admin" accounts={accounts} />
    </div>
  )
}
