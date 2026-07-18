"use client"

import { DataTable } from "@/components/ui/data-table"
import { workingHourColumns, type WorkingHourData } from "./working-hour-columns"

interface WorkingHourTableProps {
  data: WorkingHourData[]
}

export function WorkingHourTable({ data }: WorkingHourTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        columns={workingHourColumns}
        data={data}
        emptyMessage="No shift templates found. Create one to get started."
      />
    </div>
  )
}
