"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportDateFilter } from "./report-date-filter"
import { formatIDR } from "@/lib/utils"

interface DailyReportTabProps {
  data: {
    posRevenue: number
    transactionCount: number
    expenses: number
  } | null
  error?: string
}

export function DailyReportTab({ data, error }: DailyReportTabProps) {
  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  const netCashFlow = (data?.posRevenue || 0) - (data?.expenses || 0)

  return (
    <div className="space-y-6">
      <ReportDateFilter mode="single" />

      {data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendapatan POS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatIDR(data.posRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Dari {data.transactionCount} transaksi
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran (Beban)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatIDR(data.expenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total beban hari ini
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Arus Kas Bersih (Net Cash)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatIDR(netCashFlow)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pendapatan - Pengeluaran
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>Memuat data...</div>
      )}
    </div>
  )
}
