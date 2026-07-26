"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ReportDateFilter } from "./report-date-filter"
import { formatIDR } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TrialBalanceTabProps {
  data: {
    lines: any[]
    totalMovementDebit: number
    totalMovementCredit: number
    isBalanced: boolean
  } | null
  error?: string
}

export function TrialBalanceTab({ data, error }: TrialBalanceTabProps) {
  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-6">
      <ReportDateFilter mode="range" />

      {data ? (
        <Card className="pb-0">
          <CardHeader>
            <CardTitle>Neraca Saldo (Trial Balance)</CardTitle>
          </CardHeader>
          <CardContent className="">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Kode</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead className="text-right">Saldo Awal</TableHead>
                  <TableHead className="text-right">Mutasi Debit</TableHead>
                  <TableHead className="text-right">Mutasi Kredit</TableHead>
                  <TableHead className="text-right pr-6">Saldo Akhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lines.map((line: any) => (
                  <TableRow key={line.account.id}>
                    <TableCell className="pl-6">{line.account.code}</TableCell>
                    <TableCell>{line.account.name}</TableCell>
                    <TableCell className="text-right">{formatIDR(line.openingBalance)}</TableCell>
                    <TableCell className="text-right">{formatIDR(line.movementDebit)}</TableCell>
                    <TableCell className="text-right">{formatIDR(line.movementCredit)}</TableCell>
                    <TableCell className="text-right font-semibold pr-6">{formatIDR(line.closingBalance)}</TableCell>
                  </TableRow>
                ))}
                {data.lines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">Tidak ada transaksi pada periode ini.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-col items-end space-y-4 py-6 bg-muted/50 border-t">
            <div className="flex gap-8 px-6">
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase font-semibold">Total Mutasi Debit</div>
                <div className="text-lg font-bold">{formatIDR(data.totalMovementDebit)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase font-semibold">Total Mutasi Kredit</div>
                <div className="text-lg font-bold">{formatIDR(data.totalMovementCredit)}</div>
              </div>
            </div>

            {!data.isBalanced && (
              <div className="text-destructive font-bold px-6">
                ⚠️ Mutasi Debit dan Kredit tidak seimbang!
              </div>
            )}
          </CardFooter>
        </Card>
      ) : (
        <div>Memuat data...</div>
      )}
    </div>
  )
}
