"use client"

import { useMemo } from "react"
import {
  Search,
  FilterX,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { DataTable } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import {
  useServiceSessions,
  type UseServiceSessionsProps,
} from "../hooks/use-service-sessions"
import { getServiceSessionColumns } from "./service-session-columns"
import { ServiceSessionDetailDialog } from "./service-session-detail-dialog"
import type { ServiceSessionStatus } from "../schemas/service-session-query-schema"

export function ServiceSessionList({
  tenantSlug,
  initialData,
}: UseServiceSessionsProps) {
  const {
    sessions,
    loading,
    searchTerm,
    setSearchTerm,
    status,
    setStatus,
    roomId,
    setRoomId,
    staffId,
    setStaffId,
    date,
    setDate,
    page,
    setPage,
    pagination,
    summary,
    filterOptions,
    selectedSession,
    isDetailOpen,
    handleViewDetail,
    closeDetail,
    handleResetFilters,
    refresh,
  } = useServiceSessions({ tenantSlug, initialData })

  const columns = useMemo(
    () => getServiceSessionColumns({ onView: handleViewDetail }),
    [handleViewDetail]
  )

  const hasActiveFilters =
    searchTerm !== "" ||
    status !== "ALL" ||
    roomId !== "ALL" ||
    staffId !== "ALL" ||
    date !== undefined

  const handlePageChange = (
    e: React.MouseEvent,
    newPage: number
  ) => {
    e.preventDefault()
    setPage(newPage)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sesi Layanan"
        description="Kelola dan pantau seluruh sesi layanan, terapis, dan ruangan."
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              Total Sesi
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {summary.totalSessions}
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              Sedang Berlangsung
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {summary.inProgress}
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              Terjadwal
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
              {summary.scheduled}
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-muted rounded-xl text-muted-foreground shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              Selesai
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {summary.completed}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari pelanggan, terapis, layanan, ref..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-9 pr-8"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Select */}
          <Select
            value={status}
            onValueChange={(val) => {
              setStatus(val as ServiceSessionStatus)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="IN_PROGRESS">Sedang Berlangsung</SelectItem>
              <SelectItem value="SCHEDULED">Terjadwal</SelectItem>
              <SelectItem value="COMPLETED">Selesai</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>

          {/* Room Select */}
          <Select
            value={roomId}
            onValueChange={(val) => {
              setRoomId(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Ruangan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Ruangan</SelectItem>
              {filterOptions.rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} {room.isVip ? "(VIP)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Staff Select */}
          <Select
            value={staffId}
            onValueChange={(val) => {
              setStaffId(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Terapis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Terapis</SelectItem>
              {filterOptions.staffList.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Second row: Date and Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t">
          <div className="w-full sm:w-64">
            <DatePicker
              date={date}
              setDate={(newDate) => {
                setDate(newDate)
                setPage(1)
              }}
              placeholder="Pilih Tanggal Sesi"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <FilterX className="w-3.5 h-3.5" />
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={sessions}
          emptyMessage={
            loading
              ? "Memuat sesi layanan..."
              : "Tidak ada sesi layanan yang sesuai dengan filter."
          }
        />

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground order-2 sm:order-1">
              Halaman {pagination.page} dari {pagination.totalPages} (Total{" "}
              {pagination.total} sesi)
            </p>

            <div className="order-1 sm:order-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) =>
                        handlePageChange(e, Math.max(1, page - 1))
                      }
                      className={
                        page === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum = i + 1
                      if (pagination.totalPages > 5 && page > 3) {
                        pageNum = page - 2 + i
                        if (pageNum > pagination.totalPages) {
                          pageNum = pagination.totalPages - (4 - i)
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
                      )
                    }
                  )}

                  {pagination.totalPages > 5 &&
                    page < pagination.totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) =>
                        handlePageChange(
                          e,
                          Math.min(pagination.totalPages, page + 1)
                        )
                      }
                      className={
                        page === pagination.totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <ServiceSessionDetailDialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) closeDetail()
        }}
        session={selectedSession}
        tenantSlug={tenantSlug}
        onSessionUpdated={refresh}
      />
    </div>
  )
}

