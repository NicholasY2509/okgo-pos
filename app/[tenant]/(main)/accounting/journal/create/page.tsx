import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { JournalCreateForm } from "@/modules/accounting/components/journal-create-form"
import { BranchService } from "@/modules/branch/services/branch-service"
import { notFound } from "next/navigation"

export default async function CreateJournalPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const branch = await BranchService.getBranchBySubdomain(tenant)
  if (!branch) {
    notFound()
  }

  const accountsResult = await getLedgerAccountsAction()
  const accounts = accountsResult.data || []

  return (
    <div className="flex flex-col">
      <JournalCreateForm branchId={branch.id} accounts={accounts} />
    </div>
  )
}
