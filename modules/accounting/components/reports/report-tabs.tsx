"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ReportTabsProps {
  children: React.ReactNode
}

export function ReportTabs({ children }: ReportTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentTab = searchParams.get("tab") || "daily"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)

    // Clear dates when switching tabs to avoid confusion between single and range
    params.delete("date")
    params.delete("startDate")
    params.delete("endDate")

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="daily">Laporan Harian</TabsTrigger>
        <TabsTrigger value="profit-loss">Laba / Rugi</TabsTrigger>
        <TabsTrigger value="balance-sheet">Neraca (Balance Sheet)</TabsTrigger>
        <TabsTrigger value="trial-balance">Neraca Saldo</TabsTrigger>
      </TabsList>
      <div className="">
        {children}
      </div>
    </Tabs>
  )
}
