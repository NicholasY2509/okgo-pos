"use client"

import { useState, useMemo, useTransition } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getStaffColumns, type StaffData } from "./staff-columns"
import { BulkTransferStaffDialog } from "./bulk-transfer-staff-dialog"
import { BulkAssignStaffModal } from "./bulk-assign-staff-modal"
import { getMatchingStaffIdsAction } from "../actions/staff-action"
import { X, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface StaffTableProps {
  data: StaffData[]
  branches?: { id: string; name: string }[]
  roles?: { id: string; name: string }[]
  totalCount?: number
  currentFilter?: { search?: string; branchId?: string }
  emptyMessage?: string
}

export function StaffTable({
  data,
  branches = [],
  roles = [],
  totalCount,
  currentFilter,
  emptyMessage = "Tidak ada staf yang ditemukan.",
}: StaffTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isSelectingAll, startSelectingAll] = useTransition()

  const columns = useMemo(
    () => getStaffColumns({ branches, roles }),
    [branches, roles]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    // Use row.id as unique row key to preserve selection across pages
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  })

  // Selected staff IDs across all pages
  const selectedStaffIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  )

  const isAllCurrentPageSelected =
    data.length > 0 && data.every((item) => rowSelection[item.id])

  const total = totalCount ?? data.length
  const isAllMatchingSelected = total > 0 && selectedStaffIds.length >= total

  const handleClearSelection = () => {
    setRowSelection({})
  }

  const handleSelectAllMatching = () => {
    startSelectingAll(async () => {
      const result = await getMatchingStaffIdsAction(currentFilter)
      if (result.error || !result.data) {
        toast.error(result.error || "Gagal memilih seluruh staf.")
        return
      }

      const newSelection: RowSelectionState = {}
      for (const id of result.data) {
        newSelection[id] = true
      }
      setRowSelection(newSelection)
      toast.success(`${result.data.length} staf berhasil dipilih.`)
    })
  }

  return (
    <div className="space-y-3">
      {/* Bulk Action Toolbar */}
      {selectedStaffIds.length > 0 && (
        <div className="flex flex-col gap-2 p-3 rounded-lg animate-in fade-in-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                <strong className="text-primary">{selectedStaffIds.length}</strong> staf dipilih
                {total > data.length && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (dari total {total} staf)
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Batal
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {branches.length > 0 && roles.length > 0 && (
                <>
                  <BulkAssignStaffModal
                    selectedStaffIds={selectedStaffIds}
                    branches={branches}
                    roles={roles}
                    onSuccess={handleClearSelection}
                  />
                  <BulkTransferStaffDialog
                    selectedStaffIds={selectedStaffIds}
                    branches={branches}
                    roles={roles}
                    onSuccess={handleClearSelection}
                  />
                </>
              )}
            </div>
          </div>

          {/* Cross-page selection banner */}
          {isAllCurrentPageSelected && total > data.length && !isAllMatchingSelected && (
            <div className="text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-md border border-border flex items-center justify-between">
              <span>
                Semua <strong>{data.length}</strong> staf di halaman ini dipilih.
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary font-medium text-xs ml-2 cursor-pointer"
                disabled={isSelectingAll}
                onClick={handleSelectAllMatching}
              >
                {isSelectingAll ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  `Pilih seluruh ${total} staf yang sesuai`
                )}
              </Button>
            </div>
          )}

          {isAllMatchingSelected && total > data.length && (
            <div className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Seluruh <strong>{total}</strong> staf yang sesuai dengan filter telah dipilih.</span>
            </div>
          )}
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
