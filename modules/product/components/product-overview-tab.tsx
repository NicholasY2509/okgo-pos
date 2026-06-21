"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarClock, DollarSign, Activity } from "lucide-react"

interface ProductOverviewTabProps {
  productId: string
}

export function ProductOverviewTab({ productId }: ProductOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Pemesanan</CardTitle>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pendapatan Dihasilkan</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp 0</div>
          <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Konversi & Analitik</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/20 mt-2 gap-2">
            <Activity className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Grafik analitik akan muncul di sini setelah pemesanan dimulai.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
