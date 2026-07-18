"use client"

import { useState, useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { getAttendanceWorkingHourColumns, type AttendanceWorkingHourData } from "./attendance-working-hour-columns"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { deleteAttendanceWorkingHourAction } from "../actions/attendance-working-hour-action"
import { toast } from "sonner"

interface AttendanceWorkingHourTableProps {
  data: AttendanceWorkingHourData[]
}

export function AttendanceWorkingHourTable({ data }: AttendanceWorkingHourTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<AttendanceWorkingHourData | null>(null)

  const columns = useMemo(() => getAttendanceWorkingHourColumns(setDeleteTarget), [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteAttendanceWorkingHourAction(deleteTarget.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Successfully deleted schedule.")
    }
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data}
        emptyMessage="No schedules assigned yet."
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Konfirmasi Hapus"
        description="Are you sure you want to remove this schedule assignment?"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
