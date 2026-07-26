import { PageHeader } from "@/components/page-header"
import { ReportTabs } from "@/modules/accounting/components/reports/report-tabs"
import { DailyReportTab } from "@/modules/accounting/components/reports/daily-report-tab"
import { ProfitLossTab } from "@/modules/accounting/components/reports/profit-loss-tab"
import { BalanceSheetTab } from "@/modules/accounting/components/reports/balance-sheet-tab"
import { TrialBalanceTab } from "@/modules/accounting/components/reports/trial-balance-tab"
import { getDailyReportAction, getProfitAndLossAction, getBalanceSheetAction, getTrialBalanceAction } from "@/modules/accounting/actions/report-action"

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  const tab = typeof params.tab === "string" ? params.tab : "daily"
  const dateStr = typeof params.date === "string" ? params.date : undefined
  const startDateStr = typeof params.startDate === "string" ? params.startDate : undefined
  const endDateStr = typeof params.endDate === "string" ? params.endDate : undefined

  // Base options for fetching
  const options = {
    date: dateStr ? new Date(dateStr) : new Date(),
    startDate: startDateStr ? new Date(startDateStr) : undefined,
    endDate: endDateStr ? new Date(endDateStr) : undefined,
    asOfDate: dateStr ? new Date(dateStr) : new Date(), // Balance sheet usually uses a single "as of" date
  }

  // Fetch only the data needed for the active tab
  let dailyData = null
  let plData = null
  let bsData = null
  let tbData = null
  let error = undefined

  if (tab === "daily") {
    const res = await getDailyReportAction(options.date)
    if (res.success) dailyData = res.data
    else error = res.error
  } else if (tab === "profit-loss") {
    const res = await getProfitAndLossAction({ startDate: options.startDate, endDate: options.endDate })
    if (res.success) plData = res.data
    else error = res.error
  } else if (tab === "balance-sheet") {
    const res = await getBalanceSheetAction({ asOfDate: options.asOfDate })
    if (res.success) bsData = res.data
    else error = res.error
  } else if (tab === "trial-balance") {
    const res = await getTrialBalanceAction({ startDate: options.startDate, endDate: options.endDate })
    if (res.success) tbData = res.data
    else error = res.error
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Keuangan"
        description="Lihat laporan harian, laba/rugi, neraca, dan neraca saldo."
      />
      
      <ReportTabs>
        {tab === "daily" && <DailyReportTab data={dailyData as any} error={error} />}
        {tab === "profit-loss" && <ProfitLossTab data={plData as any} error={error} />}
        {tab === "balance-sheet" && <BalanceSheetTab data={bsData as any} error={error} />}
        {tab === "trial-balance" && <TrialBalanceTab data={tbData as any} error={error} />}
      </ReportTabs>
    </div>
  )
}
