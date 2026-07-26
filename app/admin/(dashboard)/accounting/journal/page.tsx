import { getJournalEntriesAction } from "@/modules/accounting/actions/journal-entry-action"
import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { PageHeader } from "@/components/page-header"
import { JournalTable } from "@/modules/accounting/components/journal-table"
import { JournalFilters } from "@/modules/accounting/components/journal-filters"
import { DataTablePagination } from "@/components/ui/data-table-pagination"

interface AdminJournalPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminJournalPage({ searchParams }: AdminJournalPageProps) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? Number(params.page) : 1;
  const limit = typeof params.limit === 'string' ? Number(params.limit) : 10;
  const startDate = typeof params.startDate === 'string' ? new Date(params.startDate) : undefined;
  const endDate = typeof params.endDate === 'string' ? new Date(params.endDate) : undefined;

  const [entriesResult, accountsResult] = await Promise.all([
    getJournalEntriesAction({ page, limit, startDate, endDate }),
    getLedgerAccountsAction()
  ])

  const entries = entriesResult.data || []
  const metadata = entriesResult.metadata || { total: 0, page, limit, totalPages: 0 }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Jurnal"
        description="Melihat dan memposting jurnal manual double-entry di seluruh cabang."
      >
        <Button asChild>
          <Link href="/admin/accounting/journal/create">
            Tambah Jurnal
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        <JournalFilters />
        <JournalTable entries={entries} isAdmin={true} />
        <DataTablePagination metadata={metadata} />
      </div>
    </div>
  )
}
