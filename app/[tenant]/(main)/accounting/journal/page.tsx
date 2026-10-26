import { getJournalEntriesAction } from "@/modules/accounting/actions/journal-entry-action"
import { getLedgerAccountsAction } from "@/modules/accounting/actions/ledger-account-action"
import { BranchService } from "@/modules/branch/services/branch-service"
import { notFound } from "next/navigation"
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
  const branch = await BranchService.getBranchBySubdomain(tenant)
  if (!branch) {
    notFound()
  }

  const searchParamsResolved = await searchParams;
  const page = typeof searchParamsResolved.page === 'string' ? Number(searchParamsResolved.page) : 1;
  const limit = typeof searchParamsResolved.limit === 'string' ? Number(searchParamsResolved.limit) : 10;
  let startDate = typeof searchParamsResolved.startDate === 'string' ? new Date(searchParamsResolved.startDate) : undefined;
  let endDate = typeof searchParamsResolved.endDate === 'string' ? new Date(searchParamsResolved.endDate) : undefined;

  if (!startDate && !endDate && typeof searchParamsResolved.month === 'string' && /^\d{4}-\d{2}$/.test(searchParamsResolved.month)) {
    const [y, m] = searchParamsResolved.month.split('-').map(Number);
    startDate = new Date(y, m - 1, 1, 0, 0, 0, 0);
    endDate = new Date(y, m, 0, 23, 59, 59, 999);
  }

  const [entriesResult] = await Promise.all([
    getJournalEntriesAction({ branchId: branch.id, page, limit, startDate, endDate }),
    getLedgerAccountsAction()
  ])

  const entries = entriesResult.data || []
  const metadata = entriesResult.metadata || { total: 0, page, limit, totalPages: 0 }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Jurnal Umum"
        description={`Melihat dan memposting jurnal double-entry untuk cabang ${branch.name}.`}
      >
        <Button asChild>
          <Link href="/accounting/journal/create">
            Tambah Jurnal
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        <JournalFilters />
        <JournalTable entries={entries} isAdmin={false} branchId={branch.id} />
        <DataTablePagination metadata={metadata} />
      </div>
    </div>
  )
}
