import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatIDR } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  BuildingIcon,
  StoreIcon,
  UsersIcon,
  Receipt,
  ArrowRight,
  TrendingUp,
  MapPin,
  ExternalLink,
  Plus,
  ShieldAlert,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const [
    branchesCount,
    activeBranchesCount,
    productsCount,
    staffCount,
    transactionsCount,
    salesAgg,
    recentBranches,
    recentTransactions,
    allBranches,
  ] = await Promise.all([
    prisma.branch.count(),
    prisma.branch.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.staff.count({ where: { isActive: true } }),
    prisma.transaction.count(),
    prisma.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { totalAmount: true },
    }),
    prisma.branch.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { branchStaffs: true },
        },
      },
    }),
    prisma.transaction.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
      },
    }),
    prisma.branch.findMany({
      select: { id: true, name: true },
    }),
  ])

  const branchMap = new Map(allBranches.map(b => [b.id, b.name]))
  const totalSales = Number(salesAgg._sum.totalAmount || 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard Utama"
        description="Ringkasan operasional seluruh cabang, produk, transaksi, dan staf."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/branches">
              <BuildingIcon className="mr-2 h-4 w-4" />
              Kelola Cabang
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/transactions">
              <Receipt className="mr-2 h-4 w-4" />
              Lihat Transaksi
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendapatan Sukses
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatIDR(totalSales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari {transactionsCount.toLocaleString("id-ID")} total transaksi sistem
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cabang Aktif
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BuildingIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {activeBranchesCount}
              <span className="text-sm text-muted-foreground font-sans font-normal ml-1">
                / {branchesCount} cabang
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {branchesCount - activeBranchesCount > 0
                ? `${branchesCount - activeBranchesCount} cabang tidak aktif`
                : "Semua cabang berstatus aktif"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Layanan & Produk
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <StoreIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {productsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Katalog aktif di sistem POS
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Staf Aktif
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <UsersIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {staffCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tergabung dalam seluruh cabang
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Cabang & Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cabang Ringkasan (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Cabang Operasional</h2>
              <p className="text-sm text-muted-foreground">
                Daftar unit cabang lokasi bisnis dan status operasionalnya.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/branches" className="flex items-center gap-1">
                <span>Lihat Semua</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentBranches.map((branch) => (
              <Card key={branch.id} className="hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold">{branch.name}</CardTitle>
                      <CardDescription className="text-xs text-primary font-mono mt-0.5">
                        {branch.subdomain}
                      </CardDescription>
                    </div>
                    <Badge variant={branch.isActive ? "default" : "secondary"} className="text-xs font-normal">
                      {branch.isActive ? "Aktif" : "Non-aktif"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm pt-0 pb-4">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{branch.address || "Belum ada alamat"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UsersIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{branch._count.branchStaffs} Staf Terdaftar</span>
                  </div>
                </CardContent>
                <div className="border-t px-4 py-2.5 bg-muted/20 flex justify-end gap-2 rounded-b-xl">
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <Link href={`/admin/branches/${branch.subdomain}`}>
                      Kelola
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}

            {recentBranches.length === 0 && (
              <div className="col-span-full p-8 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
                Belum ada cabang yang dibuat.
              </div>
            )}
          </div>
        </div>

        {/* Transaksi Terbaru (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Transaksi Terbaru</h2>
              <p className="text-sm text-muted-foreground">
                Aktivitas kasir terkini di cabang.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/transactions" className="flex items-center gap-1">
                <span>Semua</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0 divide-y">
              {recentTransactions.map((tx) => {
                const isCompleted = tx.status === "COMPLETED"
                const isVoided = tx.status === "VOIDED" || tx.status === "CANCELLED"
                return (
                  <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3 text-sm hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <div className="font-medium font-mono text-xs truncate">
                        {tx.transactionNumber}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {branchMap.get(tx.branchId) || "Cabang"} · {tx.customer?.name || "Pelanggan Walk-in"}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(tx.createdAt), "dd MMM, HH:mm", { locale: id })}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold font-mono text-sm">
                        {formatIDR(Number(tx.totalAmount))}
                      </div>
                      <Badge
                        variant={isCompleted ? "default" : isVoided ? "destructive" : "secondary"}
                        className="text-[10px] px-1.5 py-0 mt-1 font-normal"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}

              {recentTransactions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Belum ada transaksi tercatat.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
