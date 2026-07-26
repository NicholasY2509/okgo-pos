import { getExpenseEntriesAction } from "@/modules/accounting/actions/journal-entry-action"
import { format } from "date-fns"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ExpenseTable } from "@/modules/accounting/components/expense-table"
import { JournalFilters } from "@/modules/accounting/components/journal-filters"
import { DataTablePagination } from "@/components/ui/data-table-pagination"

export default async function TenantExpensesPage({ 
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
  
  // Fetch only expense-related journal entries
  const entriesResult = await getExpenseEntriesAction({ branchId: tenant, page, limit, startDate, endDate })
  const entries = entriesResult.data || []
  const metadata = entriesResult.metadata || { total: 0, page, limit, totalPages: 0 }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengeluaran"
        description="Lihat dan catat pengeluaran operasional cabang ini."
      >
        <Button asChild>
          <Link href={`/${tenant}/accounting/expenses/create`}>
            <Plus className="mr-2 h-4 w-4" />
            Catat Pengeluaran
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        <JournalFilters />
        <ExpenseTable entries={entries} isAdmin={false} branchId={tenant} />
        <DataTablePagination metadata={metadata} />
      </div>
    </div>
  )
}
