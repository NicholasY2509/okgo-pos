"use client"

import { DataTable } from "@/components/ui/data-table"
import { workPositionColumns, type WorkPositionData } from "./work-position-columns"

interface WorkPositionTableProps {
  data: WorkPositionData[]
}

export function WorkPositionTable({ data }: WorkPositionTableProps) {
  return <DataTable columns={workPositionColumns} data={data} emptyMessage="No work positions found." />
}
