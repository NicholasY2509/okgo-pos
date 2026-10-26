import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { ExpenseCreateForm } from "@/modules/accounting/components/expense-create-form"
import { BranchService } from "@/modules/branch/services/branch-service"
import { notFound } from "next/navigation"

export default async function TenantExpenseCreatePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const branch = await BranchService.getBranchBySubdomain(tenant)
  if (!branch) {
    notFound()
  }

  const accountsResult = await getLedgerAccountsAction()
  const accounts = accountsResult.data || []

  return (
    <ExpenseCreateForm branchId={branch.id} accounts={accounts} />
  )
}
