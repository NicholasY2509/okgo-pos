import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { ExpenseCreateForm } from "@/modules/accounting/components/expense-create-form"

export default async function TenantExpenseCreatePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params

  const accountsResult = await getLedgerAccountsAction(tenant)
  const accounts = accountsResult.data || []

  return (
    <ExpenseCreateForm branchId={tenant} accounts={accounts} />
  )
}
