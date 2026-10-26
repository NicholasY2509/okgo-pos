"use client";

import { useState } from "react";
import { Search, FilterX, TrendingUp, Receipt, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, subDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionDetailDialog } from "./transaction-detail-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { useTransactions } from "../hooks/use-transactions";
import { DataTable } from "@/components/ui/data-table";
import { getTransactionHistoryColumns } from "./transaction-history-columns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";

interface BranchOption {
  id: string;
  name: string;
}

interface TransactionHistoryClientProps {
  branchId?: string;
  branches?: BranchOption[];
  isAdmin?: boolean;
}

export function TransactionHistoryClient({ branchId, branches, isAdmin }: TransactionHistoryClientProps) {
  const {
    transactions,
    loading,
    selectedBranchId,
    setSelectedBranchId,
    searchTerm,
    setSearchTerm,
    date,
    setDate,
    page,
    setPage,
    pagination,
    summary,
    handleResetFilter,
    refresh,
  } = useTransactions({ branchId });

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePageChange = (e: React.MouseEvent, newPage: number) => {
    e.preventDefault();
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Transaksi"
        description={isAdmin ? "Kelola dan pantau seluruh transaksi penjualan di semua cabang." : "Kelola dan lihat riwayat transaksi cabang Anda."}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Transaksi</p>
            <p className="text-2xl font-bold">{summary.totalTransactions}</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-500/10 rounded-full text-green-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Pendapatan</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.totalSales)}</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-orange-500/10 rounded-full text-orange-500">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Diskon</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(summary.totalDiscounts)}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Pencarian</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari No. TRX atau Pelanggan..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2 w-full md:w-auto">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Tanggal Transaksi</label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setDate(subDays(date || new Date(), 1))}
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <DatePicker
                date={date}
                setDate={setDate}
                placeholder="Pilih Tanggal"
                className="w-[180px] sm:w-[200px]"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setDate(addDays(date || new Date(), 1))}
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDate(new Date())}
                title="Hari Ini"
              >
                Hari Ini
              </Button>
            </div>
          </div>
          {branches && branches.length > 0 && (
            <div className="space-y-2 w-full md:w-auto">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Cabang</label>
              <Select
                value={selectedBranchId || "all"}
                onValueChange={(val) => {
                  setSelectedBranchId(val === "all" ? undefined : val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleResetFilter} title="Reset Filter">
              <FilterX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        columns={getTransactionHistoryColumns({
          onView: (transaction) => {
            setSelectedTransaction(transaction);
            setIsDialogOpen(true);
          },
          showBranch: isAdmin || !branchId,
        })}
        data={transactions}
        emptyMessage={loading ? "Memuat transaksi..." : "Tidak ada transaksi ditemukan."}
      />

      {!loading && pagination.totalPages > 1 && (
        <div className="p-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => handlePageChange(e, Math.max(1, page - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (pagination.totalPages > 5 && page > 3) {
                  pageNum = page - 2 + i;
                  if (pageNum > pagination.totalPages) {
                    pageNum = pagination.totalPages - (4 - i);
                  }
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={page === pageNum}
                      onClick={(e) => handlePageChange(e, pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {pagination.totalPages > 5 && page < pagination.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => handlePageChange(e, Math.min(pagination.totalPages, page + 1))}
                  className={page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onTransactionCancelled={() => {
          refresh();
        }}
      />
    </div>
  );
}
