import { getExpenseEntriesAction } from "@/modules/accounting/actions/journal-entry-action"
import { format } from "date-fns"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ExpenseTable } from "@/modules/accounting/components/expense-table"
import { JournalFilters } from "@/modules/accounting/components/journal-filters"
import { DataTablePagination } from "@/components/ui/data-table-pagination"

interface AdminExpensesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminExpensesPage({ searchParams }: AdminExpensesPageProps) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? Number(params.page) : 1;
  const limit = typeof params.limit === 'string' ? Number(params.limit) : 10;
  const startDate = typeof params.startDate === 'string' ? new Date(params.startDate) : undefined;
  const endDate = typeof params.endDate === 'string' ? new Date(params.endDate) : undefined;

  // Fetch expense-related journal entries across all branches (no branchId filter)
  const entriesResult = await getExpenseEntriesAction({ page, limit, startDate, endDate })
  const entries = entriesResult.data || []
  const metadata = entriesResult.metadata || { total: 0, page, limit, totalPages: 0 }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengeluaran"
        description="Lihat dan catat pengeluaran operasional secara global."
      >
        <Button asChild>
          <Link href="/accounting/expenses/create">
            <Plus className="mr-2 h-4 w-4" />
            Catat Pengeluaran
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        <JournalFilters />
        <ExpenseTable entries={entries} isAdmin={true} />
        <DataTablePagination metadata={metadata} />
      </div>
    </div>
  )
}
