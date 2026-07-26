"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ReportDateFilter } from "./report-date-filter"
import { formatIDR } from "@/lib/utils"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

interface BalanceSheetTabProps {
  data: {
    assets: any[]
    liabilities: any[]
    equity: any[]
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
    totalLiabilitiesAndEquity: number
  } | null
  error?: string
}

export function BalanceSheetTab({ data, error }: BalanceSheetTabProps) {
  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-6">
      <ReportDateFilter mode="single" />

      {data ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aset (Assets)</CardTitle>
                </CardHeader>
                <CardContent className="">
                  <Table>
                    <TableBody>
                      {data.assets.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-6">{item.code} - {item.name}</TableCell>
                          <TableCell className="text-right pr-6">{formatIDR(item.balance)}</TableCell>
                        </TableRow>
                      ))}
                      {data.assets.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4">Tidak ada data aset</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between items-center py-4 bg-muted/50 border-t">
                  <span className="font-bold">Total Aset</span>
                  <span className="font-bold">{formatIDR(data.totalAssets)}</span>
                </CardFooter>
              </Card>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kewajiban (Liabilities)</CardTitle>
                </CardHeader>
                <CardContent className="">
                  <Table>
                    <TableBody>
                      {data.liabilities.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-6">{item.code} - {item.name}</TableCell>
                          <TableCell className="text-right pr-6">{formatIDR(item.balance)}</TableCell>
                        </TableRow>
                      ))}
                      {data.liabilities.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4">Tidak ada data kewajiban</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between items-center py-4 bg-muted/50 border-t">
                  <span className="font-bold">Total Kewajiban</span>
                  <span className="font-bold">{formatIDR(data.totalLiabilities)}</span>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ekuitas (Equity)</CardTitle>
                </CardHeader>
                <CardContent className="">
                  <Table>
                    <TableBody>
                      {data.equity.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-6">{item.code} - {item.name}</TableCell>
                          <TableCell className="text-right pr-6">{formatIDR(item.balance)}</TableCell>
                        </TableRow>
                      ))}
                      {data.equity.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4">Tidak ada data ekuitas</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between items-center py-4 bg-muted/50 border-t">
                  <span className="font-bold">Total Ekuitas</span>
                  <span className="font-bold">{formatIDR(data.totalEquity)}</span>
                </CardFooter>
              </Card>

              <Card>
                <CardContent className="flex justify-between items-center text-lg">
                  <span className="font-bold">Total Kewajiban & Ekuitas</span>
                  <span className="font-bold">{formatIDR(data.totalLiabilitiesAndEquity)}</span>
                </CardContent>
              </Card>
            </div>
          </div>

          {Math.abs(data.totalAssets - data.totalLiabilitiesAndEquity) > 0.01 && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
              <strong>Peringatan:</strong> Neraca tidak seimbang! Terdapat selisih {formatIDR(Math.abs(data.totalAssets - data.totalLiabilitiesAndEquity))}
            </div>
          )}
        </div>
      ) : (
        <div>Memuat data...</div>
      )}
    </div>
  )
}
