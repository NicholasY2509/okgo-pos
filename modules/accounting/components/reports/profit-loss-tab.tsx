"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ReportDateFilter } from "./report-date-filter"
import { formatIDR } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ProfitLossTabProps {
  data: {
    revenues: any[]
    expenses: any[]
    totalRevenue: number
    totalExpense: number
    netIncome: number
  } | null
  error?: string
}

export function ProfitLossTab({ data, error }: ProfitLossTabProps) {
  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-6">
      <ReportDateFilter mode="range" />

      {data ? (
        <div className="space-y-6">
          <Card className="pb-0">
            <CardHeader>
              <CardTitle>Pendapatan (Revenue)</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <Table>
                <TableBody className="border-none">
                  {data.revenues.map((item: any) => (
                    <TableRow key={item.id} className="border-none">
                      <TableCell className="pl-6">{item.code} - {item.name}</TableCell>
                      <TableCell className="text-right pr-6">{formatIDR(item.balance)}</TableCell>
                    </TableRow>
                  ))}
                  {data.revenues.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-4">Tidak ada data pendapatan</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between items-center py-4 bg-muted/50 border-t">
              <span className="font-bold">Total Pendapatan</span>
              <span className="font-bold">{formatIDR(data.totalRevenue)}</span>
            </CardFooter>
          </Card>

          <Card className="pb-0">
            <CardHeader>
              <CardTitle>Beban (Expenses)</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <Table>
                <TableBody>
                  {data.expenses.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6">{item.code} - {item.name}</TableCell>
                      <TableCell className="text-right pr-6">{formatIDR(item.balance)}</TableCell>
                    </TableRow>
                  ))}
                  {data.expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-4">Tidak ada data beban</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between items-center py-4 bg-muted/50 border-t">
              <span className="font-bold">Total Beban</span>
              <span className="font-bold">{formatIDR(data.totalExpense)}</span>
            </CardFooter>
          </Card>

          <Card className="py-0">
            <CardContent className="flex justify-between items-center p-6 text-lg">
              <span className="font-bold">Laba / Rugi Bersih (Net Income)</span>
              <span className="font-bold">{formatIDR(data.netIncome)}</span>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>Memuat data...</div>
      )}
    </div>
  )
}
