"use client"

import { DataTable } from "@/components/ui/data-table"
import { attendanceDataColumns, type DummyAttendanceData } from "./attendance-data-columns"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface AttendanceDataTableProps {
  data: DummyAttendanceData[]
}

export function AttendanceDataTable({ data }: AttendanceDataTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" disabled>
          <Download className="mr-2 h-4 w-4" /> Export Data
        </Button>
      </div>

      <DataTable 
        columns={attendanceDataColumns} 
        data={data} 
        emptyMessage="No attendance records found for this period." 
      />
    </div>
  )
}
