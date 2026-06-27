"use client";

import { useState } from "react";
import { Search, FilterX, TrendingUp, Receipt, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionDetailDialog } from "./transaction-detail-dialog";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
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

interface TransactionHistoryClientProps {
  branchId: string;
}

export function TransactionHistoryClient({ branchId }: TransactionHistoryClientProps) {
  const {
    transactions,
    loading,
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    page,
    setPage,
    pagination,
    summary,
    handleResetFilter,
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Riwayat Transaksi</h2>
          <p className="text-muted-foreground mt-1">Kelola dan lihat riwayat transaksi cabang Anda.</p>
        </div>
      </div>

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
          <div className="space-y-2 w-full md:w-[260px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Rentang Waktu</label>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleResetFilter} title="Reset Filter">
              <FilterX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          columns={getTransactionHistoryColumns({
            onView: (transaction) => {
              setSelectedTransaction(transaction);
              setIsDialogOpen(true);
            },
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
      </div>

      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
