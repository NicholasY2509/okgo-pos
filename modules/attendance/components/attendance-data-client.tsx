"use client"

import { useState } from "react"
import { AttendanceFilters } from "./attendance-filters"
import { AttendanceTable } from "./attendance-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { AttendanceDetailDialog } from "./attendance-detail-dialog"

interface AttendanceDataClientProps {
  data: any
  statuses: any[]
}

export function AttendanceDataClient({ data, statuses }: AttendanceDataClientProps) {
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | null>(null)

  const selectedAttendance = data.attendances.find((a: any) => a.id === selectedAttendanceId) || null

  return (
    <>
      <AttendanceFilters statuses={statuses} />
      <AttendanceTable 
        data={data.attendances} 
        statuses={statuses} 
        onRowClick={(row) => setSelectedAttendanceId(row.id)} 
      />
      <DataTablePagination metadata={data.metadata} />
      <AttendanceDetailDialog 
        attendance={selectedAttendance} 
        statuses={statuses} 
        open={!!selectedAttendanceId}
        onOpenChange={(open) => { if (!open) setSelectedAttendanceId(null) }}
      />
    </>
  )
}
