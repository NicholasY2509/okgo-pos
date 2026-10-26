import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { formatIDR } from "@/lib/utils"
import {
  Book,
  FileText,
  Banknote,
  BarChart3,
  TrendingUp,
  Receipt,
  Scale,
  BookOpen,
  ArrowRight,
  Plus,
  Eye,
  Settings2Icon,
} from "lucide-react"
import { ReportService } from "@/modules/accounting/services/report-service"
import { JournalEntryService } from "@/modules/accounting/services/journal-entry-service"
import { AccountingMonthFilter } from "@/modules/accounting/components/accounting-month-filter"

export const dynamic = "force-dynamic"

export default async function AdminAccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParamsResolved = await searchParams

  const today = new Date()
  const currentMonthStr = format(today, "yyyy-MM")
  const selectedMonthStr =
    typeof searchParamsResolved.month === "string" &&
    /^\d{4}-\d{2}$/.test(searchParamsResolved.month)
      ? searchParamsResolved.month
      : currentMonthStr

  const [year, monthNum] = selectedMonthStr.split("-").map(Number)
  const startOfMonth = new Date(year, monthNum - 1, 1, 0, 0, 0, 0)
  const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999)
  const isCurrentMonth = selectedMonthStr === currentMonthStr
  const monthName = format(startOfMonth, "MMMM yyyy", { locale: id })

  // Fetch consolidated financial statistics for the selected month across all branches
  const [monthPnl, recentEntriesResult] = await Promise.all([
    ReportService.generateProfitAndLoss({
      startDate: startOfMonth,
      endDate: endOfMonth,
    }),
    JournalEntryService.getAllByBranch({
      startDate: startOfMonth,
      endDate: endOfMonth,
      page: 1,
      limit: 8,
    }),
  ])

  const recentEntries = recentEntriesResult.data || []
  const totalEntriesCount = recentEntriesResult.metadata?.total || 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Akuntansi & Keuangan"
        description="Konsolidasi pembukuan, buku besar, pengeluaran, dan laporan keuangan seluruh cabang."
      >
        <div className="flex flex-wrap items-center gap-2">
          <AccountingMonthFilter currentMonth={selectedMonthStr} />
          <Button variant="outline" asChild>
            <Link href="/admin/accounting/expenses/create">
              <Plus className="mr-2 h-4 w-4" />
              Catat Pengeluaran
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/accounting/journal/create">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jurnal
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Financial Metrics Cards for Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendapatan {isCurrentMonth ? "Bulan Ini" : monthName}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatIDR(monthPnl.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendapatan seluruh cabang periode {monthName}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pengeluaran {isCurrentMonth ? "Bulan Ini" : monthName}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatIDR(monthPnl.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Beban operasional seluruh cabang periode {monthName}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Laba Bersih {isCurrentMonth ? "Bulan Ini" : monthName}
            </CardTitle>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                monthPnl.netIncome >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <Scale className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                monthPnl.netIncome >= 0 ? "text-foreground" : "text-destructive"
              }`}
            >
              {formatIDR(monthPnl.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendapatan {formatIDR(monthPnl.totalRevenue)} · Beban {formatIDR(monthPnl.totalExpense)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jurnal {isCurrentMonth ? "Bulan Ini" : monthName}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {totalEntriesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Jurnal transaksi sistem periode {monthName}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounting Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Menu Akuntansi Admin</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href={`/admin/accounting/journal?month=${selectedMonthStr}`} className="group">
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Book className="h-5 w-5" />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Jurnal Umum</span>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Pencatatan dan review jurnal double-entry debit-kredit seluruh cabang.
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/accounting/expenses?month=${selectedMonthStr}`} className="group">
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Pengeluaran</span>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Monitoring beban operasional, kas kecil, utilitas, dan pengeluaran cabang.
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/accounting/coa" className="group">
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Banknote className="h-5 w-5" />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Bagan Akun</span>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Master akun aset, liabilitas, ekuitas, pendapatan, dan beban global.
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/accounting/reports?month=${selectedMonthStr}`} className="group">
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Laporan Keuangan</span>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Laporan harian, laba/rugi, neraca saldo, dan neraca konsolidasi.
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/payment-methods" className="group">
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Settings2Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Metode Bayar</span>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Konfigurasi metode pembayaran kasir dan pemetaan akun buku besar.
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Journal Activity across branches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Jurnal Konsolidasi ({monthName})</h2>
            <p className="text-sm text-muted-foreground">
              Aktivitas jurnal pembukuan terbaru dari seluruh cabang pada periode {monthName}.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/admin/accounting/journal?month=${selectedMonthStr}`}
              className="flex items-center gap-1"
            >
              <span>Lihat Semua Jurnal ({monthName})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-muted/40 font-medium grid grid-cols-12 gap-4 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="col-span-2">Tanggal</div>
            <div className="col-span-2">Cabang</div>
            <div className="col-span-3">Deskripsi / No. Jurnal</div>
            <div className="col-span-2 text-right">Debit</div>
            <div className="col-span-2 text-right">Kredit</div>
            <div className="col-span-1 text-right">Aksi</div>
          </div>
          <div className="divide-y">
            {recentEntries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Belum ada transaksi jurnal yang tercatat pada periode {monthName}.
              </div>
            ) : (
              recentEntries.map((entry) => {
                const totalDebit = entry.lines.reduce(
                  (sum: number, l: any) => sum + Number(l.debit || 0),
                  0
                )
                const totalCredit = entry.lines.reduce(
                  (sum: number, l: any) => sum + Number(l.credit || 0),
                  0
                )

                return (
                  <div
                    key={entry.id}
                    className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-muted/30 transition-colors text-sm"
                  >
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {format(new Date(entry.date), "dd MMM yyyy")}
                    </div>
                    <div className="col-span-2 font-medium truncate text-xs">
                      {entry.branch?.name || entry.branchName || "Pusat / Global"}
                    </div>
                    <div className="col-span-3">
                      <div className="font-medium text-foreground truncate">{entry.description}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {entry.journalNumber || "-"}
                        {entry.reference && (
                          <span className="ml-2 pl-2 border-l border-muted">
                            Ref: {entry.reference}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-right font-medium font-mono text-xs">
                      {formatIDR(totalDebit)}
                    </div>
                    <div className="col-span-2 text-right font-medium font-mono text-xs">
                      {formatIDR(totalCredit)}
                    </div>
                    <div className="col-span-1 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/accounting/journal/${entry.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
