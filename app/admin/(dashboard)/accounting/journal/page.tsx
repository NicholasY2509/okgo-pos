import { getJournalEntriesAction } from "@/modules/accounting/actions/journal-entry-action"
import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { PageHeader } from "@/components/page-header"
import { JournalTable } from "@/modules/accounting/components/journal-table"

export default async function AdminJournalPage() {
  const [entriesResult, accountsResult] = await Promise.all([
    getJournalEntriesAction(),
    getLedgerAccountsAction()
  ])

  const entries = entriesResult.data || []
  const accounts = accountsResult.data || []

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Journal Entries (Admin)"
        description="View and post manual double-entry journals across all branches."
      >
        <Button asChild>
          <Link href="/admin/accounting/journal/create">
            Tambah Jurnal
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        <JournalTable entries={entries} isAdmin={true} />
      </div>
    </div>
  )
}
