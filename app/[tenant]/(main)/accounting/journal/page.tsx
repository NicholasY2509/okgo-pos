import { getJournalEntriesAction } from "@/modules/accounting/actions/journal-entry-action"
import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"
import { JournalTable } from "@/modules/accounting/components/journal-table"
import { JournalFilters } from "@/modules/accounting/components/journal-filters"
import { DataTablePagination } from "@/components/ui/data-table-pagination"

export default async function JournalPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ tenant: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tenant } = await params
  const searchParamsResolved = await searchParams;
  const page = typeof searchParamsResolved.page === 'string' ? Number(searchParamsResolved.page) : 1;
  const limit = typeof searchParamsResolved.limit === 'string' ? Number(searchParamsResolved.limit) : 10;
  const startDate = typeof searchParamsResolved.startDate === 'string' ? new Date(searchParamsResolved.startDate) : undefined;
  const endDate = typeof searchParamsResolved.endDate === 'string' ? new Date(searchParamsResolved.endDate) : undefined;

  const [entriesResult, accountsResult] = await Promise.all([
    getJournalEntriesAction({ branchId: tenant, page, limit, startDate, endDate }),
    getLedgerAccountsAction(tenant)
  ])

  const entries = entriesResult.data || []
  const metadata = entriesResult.metadata || { total: 0, page, limit, totalPages: 0 }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Journal Entries"
        description="View and post manual double-entry journals."
      >
        <Button asChild>
          <Link href={`/${tenant}/accounting/journal/create`}>
            Tambah Jurnal
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        <JournalFilters />
        <JournalTable entries={entries} branchId={tenant} />
        <DataTablePagination metadata={metadata} />
      </div>
    </div>
  )
}
