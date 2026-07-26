import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { ExpenseCreateForm } from "@/modules/accounting/components/expense-create-form"

export default async function AdminExpenseCreatePage() {
  const accountsResult = await getLedgerAccountsAction()
  const accounts = accountsResult.data || []

  return (
    <ExpenseCreateForm branchId="admin" accounts={accounts} />
  )
}
