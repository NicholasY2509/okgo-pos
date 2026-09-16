"use client";

import React, { useState, Fragment } from "react";
import { Search, FilterX, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { useStaffIncentives } from "../hooks/use-staff-incentives";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NumericFormat } from "react-number-format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IncentiveSettings } from "./incentive-settings";
import { PageHeader } from "@/components/page-header";
import { StaffIncentiveDetailsTable } from "./staff-incentive-details-table";

export function StaffIncentiveClient({ workPositions = [], initialRules = [] }: { workPositions?: any[], initialRules?: any[] }) {
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const {
    summary,
    loading,
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    incentiveRuleId,
    setIncentiveRuleId,
    handleResetFilter,
  } = useStaffIncentives(initialRules);

  let grossTitle = "Pendapatan Kotor";
  let grossDesc = "Total nilai transaksi atau layanan";
  let incentiveTitle = "Insentif Diberikan";
  let incentiveDesc = "Total insentif untuk staf";
  let countTitle = "Total Tindakan";
  let countDesc = "Jumlah layanan atau transaksi";
  let showCount = true;

  if (incentiveRuleId !== "ALL") {
    const selectedRule = initialRules.find(r => r.id === incentiveRuleId);
    if (selectedRule) {
      if (selectedRule.ruleType === "SERVICE_PRICE_PERCENTAGE") {
        grossTitle = "Pendapatan Kotor Layanan";
        grossDesc = "Total pendapatan dari layanan selesai";
        incentiveTitle = "Insentif Terapis";
        incentiveDesc = "Total insentif untuk terapis";
        countTitle = "Layanan Selesai";
        countDesc = "Jumlah layanan yang dikerjakan";
      } else if (selectedRule.ruleType === "VOUCHER_SALES_TIERED") {
        grossTitle = "Penjualan Paket Voucher";
        grossDesc = "Total pendapatan penjualan paket voucher";
        incentiveTitle = "Insentif Kasir";
        incentiveDesc = "Total insentif dari penjualan paket";
        countTitle = "Paket Terjual";
        countDesc = "Jumlah paket voucher yang terjual";
      } else {
        grossTitle = "Pendapatan Kotor Cabang";
        grossDesc = "Total seluruh pendapatan penjualan cabang";
        incentiveTitle = "Insentif SPV / Ekstra";
        incentiveDesc = "Total insentif khusus";
        showCount = false;
      }
    }
  }

  return (
    <Tabs defaultValue="list" className="space-y-6">
      <PageHeader
        title="Insentif Staf"
        description="Kelola dan lihat daftar insentif serta aturan pembagian Insentif."
      >
        <TabsList>
          <TabsTrigger value="list">Daftar Insentif</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>
      </PageHeader>

      <TabsContent value="list" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari staf atau deskripsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={incentiveRuleId} onValueChange={setIncentiveRuleId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Aturan Insentif" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Aturan</SelectItem>
                {initialRules.map((rule) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
            />
          </div>

          {(searchTerm || incentiveRuleId !== "") && (
            <Button
              variant="ghost"
              onClick={handleResetFilter}
              className="text-slate-500 hover:text-slate-800"
            >
              <FilterX className="h-4 w-4 mr-2" />
              Reset Filter
            </Button>
          )}
        </div>

        <div>
          {!incentiveRuleId ? (
            <div className="p-8 text-center text-slate-500">Silakan pilih aturan insentif untuk melihat data.</div>
          ) : loading ? (
            <div className="p-8 text-center text-slate-500">Memuat data...</div>
          ) : (
            <>
              <div className={`grid gap-4 ${showCount ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{grossTitle}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <NumericFormat
                        value={summary.totalGross}
                        displayType="text"
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="Rp "
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{grossDesc}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{incentiveTitle}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      <NumericFormat
                        value={summary.totalIncentive}
                        displayType="text"
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="Rp "
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{incentiveDesc}</p>
                  </CardContent>
                </Card>

                {showCount && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{countTitle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        <NumericFormat
                          value={summary.totalCount}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{countDesc}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {summary.branchBreakdowns && summary.branchBreakdowns.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Rincian per Cabang</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cabang</TableHead>
                        {summary.branchBreakdowns[0]?.tierName && <TableHead>Info Tier</TableHead>}
                        <TableHead className="text-right">Pendapatan Kotor</TableHead>
                        <TableHead className="text-right">Insentif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.branchBreakdowns.map((b, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{b.branchName}</TableCell>
                          {b.tierName !== undefined && (
                            <TableCell className="text-slate-500 text-sm">
                              {b.tierName}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <NumericFormat
                              value={b.gross}
                              displayType="text"
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="Rp "
                            />
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            <NumericFormat
                              value={b.incentive}
                              displayType="text"
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="Rp "
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {summary.staffBreakdowns && summary.staffBreakdowns.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Rincian per Staf</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staf</TableHead>
                        {summary.staffBreakdowns?.some(s => s.tierName !== undefined) && <TableHead>Info Tier</TableHead>}
                        <TableHead className="text-right">{countTitle}</TableHead>
                        <TableHead className="text-right">Pendapatan Kotor</TableHead>
                        <TableHead className="text-right">Insentif Diberikan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.staffBreakdowns.map((s, i) => (
                        <React.Fragment key={i}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setExpandedStaffId(expandedStaffId === s.staffId ? null : s.staffId)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {expandedStaffId === s.staffId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {s.staffName}
                              </div>
                            </TableCell>
                            {summary.staffBreakdowns?.some(sb => sb.tierName !== undefined) && (
                              <TableCell className="text-slate-500 text-sm">
                                {s.tierName || "-"}
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <NumericFormat
                                value={s.count}
                                displayType="text"
                                thousandSeparator="."
                                decimalSeparator=","
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <NumericFormat
                                value={s.gross}
                                displayType="text"
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="Rp "
                              />
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              <NumericFormat
                                value={s.incentive}
                                displayType="text"
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="Rp "
                              />
                            </TableCell>
                          </TableRow>
                          {expandedStaffId === s.staffId && (
                            <TableRow>
                              <TableCell colSpan={summary.staffBreakdowns?.some(sb => sb.tierName !== undefined) ? 5 : 4} className="p-0 border-b-0">
                                <StaffIncentiveDetailsTable
                                  staffId={s.staffId}
                                  type={s.type}
                                  startDate={dateRange?.from}
                                  endDate={dateRange?.to}
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="settings">
        <IncentiveSettings workPositions={workPositions} initialRules={initialRules} />
      </TabsContent>
    </Tabs>
  );
}
