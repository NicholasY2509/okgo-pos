import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { CoaForm } from "@/modules/accounting/components/coa-form"

export default async function CoaPage({ params }: { params: Promise<{ tenant: string }> }) {
  const result = await getLedgerAccountsAction()
  const accounts = result.data || []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
        <p className="text-muted-foreground">Manage your ledger accounts across the tenant.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <CoaForm branchId="" />
        </div>
        <div className="md:col-span-2">
          <div className="rounded-md border bg-card">
            <div className="p-4 border-b bg-muted/50 font-medium grid grid-cols-4 gap-4">
              <div>Code</div>
              <div className="col-span-2">Name</div>
              <div>Type</div>
            </div>
            <div className="divide-y">
              {accounts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No accounts found. Create one to get started.
                </div>
              ) : (
                accounts.map((acc: any) => (
                  <div key={acc.id} className="p-4 grid grid-cols-4 gap-4 items-center">
                    <div className="font-mono text-sm">{acc.code}</div>
                    <div className="col-span-2 font-medium">{acc.name}</div>
                    <div>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {acc.type}
                      </span>
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
