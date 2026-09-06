"use client";

import { Search, FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { useStaffIncentives } from "../hooks/use-staff-incentives";
import { DataTable } from "@/components/ui/data-table";
import { getStaffIncentiveColumns } from "./staff-incentive-columns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";

export function StaffIncentiveClient() {
  const {
    incentives,
    loading,
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    page,
    setPage,
    pagination,
    handleResetFilter,
  } = useStaffIncentives();

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="mt-4 flex justify-end">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            <PaginationItem>
              <span className="text-sm text-gray-600 px-4">
                Halaman {page} dari {pagination.totalPages}
              </span>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className={page === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Daftar Insentif</h2>
          <p className="text-sm text-slate-500">
            Lihat dan kelola insentif staf (komisi terapis dan kasir)
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex gap-4 items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari staf atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>
          
          <DatePickerWithRange 
            date={dateRange} 
            setDate={setDateRange} 
          />
        </div>

        {(searchTerm || dateRange) && (
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data...</div>
        ) : (
          <DataTable
            columns={getStaffIncentiveColumns()}
            data={incentives}
          />
        )}
      </div>

      {!loading && renderPagination()}
    </div>
  );
}
