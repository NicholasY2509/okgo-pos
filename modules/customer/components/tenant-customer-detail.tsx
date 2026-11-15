"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FilterX,
  Mail,
  Phone,
  Receipt,
  Sparkles,
  Star,
  Ticket,
} from "lucide-react";
import { addDays, format, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/page-header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCustomerDetail, type CustomerDetailData } from "../hooks/use-customer-detail";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const voucherStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="default">Aktif</Badge>;
    case "USED_UP":
      return <Badge variant="secondary">Habis</Badge>;
    case "EXPIRED":
      return <Badge variant="outline">Kedaluwarsa</Badge>;
    case "VOID":
      return <Badge variant="destructive">Void</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
    case "PROCESSED":
      return <Badge variant="default">{status}</Badge>;
    case "PENDING":
    case "SCHEDULED":
      return <Badge variant="secondary">{status}</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600">{status}</Badge>;
    case "CANCELLED":
    case "VOIDED":
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

function PaginationBar({
  page,
  totalPages,
  total,
  label,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  label: string;
  onPageChange: (newPage: number) => void;
}) {
  if (totalPages <= 1) return null;

  const handleClick = (e: React.MouseEvent, target: number) => {
    e.preventDefault();
    onPageChange(target);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
      <p className="text-sm text-muted-foreground">
        Halaman {page} dari {totalPages} ({total} {label})
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => handleClick(e, Math.max(1, page - 1))}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => handleClick(e, p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => handleClick(e, Math.min(totalPages, page + 1))}
              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export function TenantCustomerDetail({ data }: { data: CustomerDetailData }) {
  const {
    vouchers,
    voucherFilter,
    voucherPage,
    voucherTotal,
    voucherTotalPages,
    isLoadingVouchers,
    setVoucherPage,
    handleVoucherFilterChange,
    activities,
    activityFilter,
    activityDate,
    activityPage,
    activityTotal,
    activityTotalPages,
    isLoadingActivities,
    setActivityPage,
    handleActivityFilterChange,
    handleActivityDateChange,
    handleResetActivityFilters,
  } = useCustomerDetail(data);

  const totalAllActivities =
    data.counts.transactionCount +
    data.counts.serviceSessionCount +
    data.counts.bookingCount;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/customers"
        backLabel="Kembali ke Daftar Pelanggan"
        title={data.customer.name}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {data.customer.phone || "-"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {data.customer.email || "-"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Terdaftar {format(new Date(data.customer.createdAt), "dd MMM yyyy", { locale: idLocale })}
            </span>
          </span>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Voucher Aktif</p>
            <p className="text-2xl font-bold">{data.counts.activeVoucherCount}</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-500/10 rounded-full text-green-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Transaksi</p>
            <p className="text-2xl font-bold">{data.counts.transactionCount}</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Sesi Layanan</p>
            <p className="text-2xl font-bold">{data.counts.serviceSessionCount}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="vouchers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vouchers" className="gap-2">
            <Ticket className="w-4 h-4" />
            Voucher Dimiliki ({data.counts.totalVoucherCount})
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Aktivitas Pelanggan ({totalAllActivities})
          </TabsTrigger>
        </TabsList>

        {/* Vouchers Tab */}
        <TabsContent value="vouchers" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-xl border shadow-sm">
            <Button
              size="sm"
              variant={voucherFilter === "ALL" ? "default" : "outline"}
              onClick={() => handleVoucherFilterChange("ALL")}
            >
              Semua ({data.counts.totalVoucherCount})
            </Button>
            <Button
              size="sm"
              variant={voucherFilter === "ACTIVE" ? "default" : "outline"}
              onClick={() => handleVoucherFilterChange("ACTIVE")}
            >
              Aktif ({data.counts.activeVoucherCount})
            </Button>
            <Button
              size="sm"
              variant={voucherFilter === "INACTIVE" ? "default" : "outline"}
              onClick={() => handleVoucherFilterChange("INACTIVE")}
            >
              Habis / Void ({data.counts.totalVoucherCount - data.counts.activeVoucherCount})
            </Button>
          </div>

          <div className={isLoadingVouchers ? "opacity-60 transition-opacity" : ""}>
            {vouchers.length === 0 ? (
              <Card className="py-0">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  Pelanggan belum memiliki voucher pada kategori ini.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vouchers.map((voucher) => {
                  const isVisit = voucher.initialVisitCount != null;
                  return (
                    <Card key={voucher.id} className="py-0 overflow-hidden">
                      <CardHeader className="py-4 bg-muted/20 border-b">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-base font-mono">{voucher.code}</CardTitle>
                            <CardDescription className="mt-0.5">
                              {voucher.voucherPacket.name}
                              {voucher.voucherPacket.productName
                                ? ` • ${voucher.voucherPacket.productName}`
                                : ""}
                            </CardDescription>
                          </div>
                          {voucherStatusBadge(voucher.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {isVisit ? "Sisa Kunjungan" : "Sisa Saldo Kredit"}
                          </span>
                          <span className="font-semibold text-base">
                            {isVisit
                              ? `${voucher.remainingVisitCount ?? 0} / ${voucher.initialVisitCount} visit`
                              : `${formatCurrency(voucher.remainingCreditAmount ?? 0)} / ${formatCurrency(
                                  voucher.initialCreditAmount ?? 0
                                )}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Dibeli:{" "}
                            {format(new Date(voucher.createdAt), "dd MMM yyyy", { locale: idLocale })}
                          </span>
                          <span>
                            Berlaku s/d:{" "}
                            {voucher.expiresAt
                              ? format(new Date(voucher.expiresAt), "dd MMM yyyy", { locale: idLocale })
                              : "Tidak ada batas"}
                          </span>
                        </div>

                        {voucher.redemptions.length > 0 && (
                          <div className="pt-3 border-t space-y-1.5">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Riwayat Pemakaian ({voucher.redemptions.length})
                            </div>
                            <div className="space-y-1">
                              {voucher.redemptions.map((r) => (
                                <div
                                  key={r.id}
                                  className="flex items-center justify-between text-xs bg-muted/30 px-2.5 py-1.5 rounded-md"
                                >
                                  <span className="font-mono">{r.transactionNumber || "-"}</span>
                                  <span className="text-muted-foreground">
                                    {format(new Date(r.redeemedAt), "dd MMM yyyy HH:mm", {
                                      locale: idLocale,
                                    })}
                                  </span>
                                  <span className="font-medium">
                                    {r.redeemedVisitCount
                                      ? `-${r.redeemedVisitCount} visit`
                                      : r.redeemedAmount != null
                                        ? `-${formatCurrency(r.redeemedAmount)}`
                                        : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <PaginationBar
            page={voucherPage}
            totalPages={voucherTotalPages}
            total={voucherTotal}
            label="voucher"
            onPageChange={setVoucherPage}
          />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Jenis Aktivitas
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={activityFilter === "ALL" ? "default" : "outline"}
                    onClick={() => handleActivityFilterChange("ALL")}
                  >
                    Semua ({totalAllActivities})
                  </Button>
                  <Button
                    size="sm"
                    variant={activityFilter === "TRANSACTION" ? "default" : "outline"}
                    onClick={() => handleActivityFilterChange("TRANSACTION")}
                  >
                    Transaksi ({data.counts.transactionCount})
                  </Button>
                  <Button
                    size="sm"
                    variant={activityFilter === "SESSION" ? "default" : "outline"}
                    onClick={() => handleActivityFilterChange("SESSION")}
                  >
                    Sesi Layanan ({data.counts.serviceSessionCount})
                  </Button>
                  <Button
                    size="sm"
                    variant={activityFilter === "BOOKING" ? "default" : "outline"}
                    onClick={() => handleActivityFilterChange("BOOKING")}
                  >
                    Booking ({data.counts.bookingCount})
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Tanggal Aktivitas
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        handleActivityDateChange(subDays(activityDate || new Date(), 1))
                      }
                      title="Hari Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <DatePicker
                      date={activityDate}
                      setDate={handleActivityDateChange}
                      placeholder="Semua Tanggal"
                      className="w-[180px] sm:w-[200px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        handleActivityDateChange(addDays(activityDate || new Date(), 1))
                      }
                      title="Hari Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {(activityFilter !== "ALL" || activityDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10"
                    onClick={handleResetActivityFilters}
                  >
                    <FilterX className="w-4 h-4 mr-1.5" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className={isLoadingActivities ? "opacity-60 transition-opacity" : ""}>
            {activities.length === 0 ? (
              <Card className="py-0">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  Tidak ada aktivitas pelanggan yang sesuai dengan filter.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <Card key={act.id} className="py-0">
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {act.kind === "TRANSACTION" && <Receipt className="w-4 h-4 text-primary" />}
                            {act.kind === "SESSION" && <Sparkles className="w-4 h-4 text-primary" />}
                            {act.kind === "BOOKING" && <Calendar className="w-4 h-4 text-primary" />}
                            <span className="font-semibold text-sm">{act.title}</span>
                            {statusBadge(act.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(act.date), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                          </p>
                        </div>

                        {act.kind === "TRANSACTION" && (
                          <div className="text-left sm:text-right">
                            <div className="font-semibold text-sm">
                              {formatCurrency(act.payload.totalAmount)}
                            </div>
                            {act.payload.payments.length > 0 && (
                              <div className="text-xs text-muted-foreground flex items-center sm:justify-end gap-1 mt-0.5">
                                <CreditCard className="w-3 h-3" />
                                {act.payload.payments.map((p: any) => p.methodName).join(", ")}
                              </div>
                            )}
                          </div>
                        )}

                        {act.kind === "BOOKING" && (
                          <div className="font-semibold text-sm">
                            {formatCurrency(act.payload.totalAmount)}
                          </div>
                        )}
                      </div>

                      {act.kind === "TRANSACTION" && act.payload.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t text-xs space-y-1">
                          {act.payload.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-muted-foreground">
                              <span>
                                {item.itemNameSnapshot} x{item.quantity}
                              </span>
                              <span>{formatCurrency(item.subtotal)}</span>
                            </div>
                          ))}
                          {act.payload.voucherCodes.length > 0 && (
                            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="text-muted-foreground">Voucher dipakai:</span>
                              {act.payload.voucherCodes.map((code: string) => (
                                <Badge key={code} variant="outline" className="font-mono text-[10px]">
                                  {code}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {act.kind === "SESSION" && (
                        <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                          {act.payload.roomName && <span>Ruangan: {act.payload.roomName}</span>}
                          {act.payload.staffName && <span>Terapis: {act.payload.staffName}</span>}
                          {act.payload.transactionNumber && (
                            <span>Transaksi: {act.payload.transactionNumber}</span>
                          )}
                          {act.payload.rating != null && (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {act.payload.rating}/5
                              {act.payload.reviewComment ? ` — "${act.payload.reviewComment}"` : ""}
                            </span>
                          )}
                        </div>
                      )}

                      {act.kind === "BOOKING" && act.payload.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t text-xs space-y-1">
                          {act.payload.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-muted-foreground">
                              <span>
                                {item.itemNameSnapshot} x{item.quantity}
                              </span>
                              <span>{formatCurrency(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <PaginationBar
            page={activityPage}
            totalPages={activityTotalPages}
            total={activityTotal}
            label="aktivitas"
            onPageChange={setActivityPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
