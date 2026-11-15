"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Search, FilterX, Ticket, Receipt, Calendar, Users, Eye } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/page-header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCustomerDirectory, type CustomerDirectoryItem } from "../hooks/use-customer-directory";

interface TenantCustomerDirectoryProps {
  initialCustomers: CustomerDirectoryItem[];
  initialTotal: number;
}

export function TenantCustomerDirectory({
  initialCustomers,
  initialTotal,
}: TenantCustomerDirectoryProps) {
  const {
    customers,
    query,
    page,
    total,
    totalPages,
    isLoading,
    setPage,
    handleSearchChange,
  } = useCustomerDirectory(initialCustomers, initialTotal);

  const totalActiveVouchersOnPage = useMemo(
    () => customers.reduce((sum, c) => sum + c.activeVoucherCount, 0),
    [customers]
  );

  const totalTransactionsOnPage = useMemo(
    () => customers.reduce((sum, c) => sum + c.transactionCount, 0),
    [customers]
  );

  const columns: ColumnDef<CustomerDirectoryItem>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nama Pelanggan",
        cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
      },
      {
        id: "contact",
        header: "Kontak",
        cell: ({ row }) => (
          <div>
            <div className="text-sm">{row.original.phone || "-"}</div>
            {row.original.email && (
              <div className="text-xs text-muted-foreground">{row.original.email}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "activeVoucherCount",
        header: "Voucher Aktif",
        cell: ({ row }) => (
          <Badge
            variant={row.original.activeVoucherCount > 0 ? "default" : "secondary"}
            className="gap-1"
          >
            <Ticket className="w-3 h-3" />
            {row.original.activeVoucherCount}
          </Badge>
        ),
      },
      {
        accessorKey: "transactionCount",
        header: "Transaksi",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Receipt className="w-3.5 h-3.5" />
            {row.original.transactionCount}
          </span>
        ),
      },
      {
        accessorKey: "bookingCount",
        header: "Booking",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {row.original.bookingCount}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Terdaftar",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: idLocale })}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button asChild variant="outline" size="sm">
              <Link href={`/customers/${row.original.id}`}>
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Detail
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const handlePageChange = (e: React.MouseEvent, newPage: number) => {
    e.preventDefault();
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Pelanggan"
        description="Kelola dan lihat profil pelanggan, voucher aktif yang dimiliki, serta riwayat aktivitas."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Pelanggan</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-500/10 rounded-full text-green-600">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Voucher Aktif (Halaman Ini)</p>
            <p className="text-2xl font-bold">{totalActiveVouchersOnPage}</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Transaksi (Halaman Ini)</p>
            <p className="text-2xl font-bold">{totalTransactionsOnPage}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, nomor telepon, atau email pelanggan..."
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {query && (
          <Button variant="outline" size="sm" onClick={() => handleSearchChange("")}>
            <FilterX className="w-4 h-4 mr-1.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Data Table */}
      <div className={isLoading ? "opacity-60 transition-opacity" : ""}>
        <DataTable columns={columns} data={customers} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages} ({total} pelanggan)
          </p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => handlePageChange(e, Math.max(1, page - 1))}
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
                      onClick={(e) => handlePageChange(e, p)}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => handlePageChange(e, Math.min(totalPages, page + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
