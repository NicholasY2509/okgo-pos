"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatIDR } from "@/lib/utils"
import { StaffSalaryDialog } from "./staff-salary-dialog"

export type StaffSalaryTableData = {
  id: string
  firstName: string
  lastName: string
  workPosition: {
    name: string
  }
  currentSalary?: {
    id: string
    baseSalary: number
    effectiveDate: Date
  }
}

export const staffSalariesColumns: ColumnDef<StaffSalaryTableData>[] = [
  {
    accessorKey: "name",
    header: "Nama Staf",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </div>
      )
    },
  },
  {
    accessorKey: "workPosition",
    header: "Posisi",
    cell: ({ row }) => {
      return (
        <Badge variant="outline">
          {row.original.workPosition?.name || "-"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "baseSalary",
    header: "Gaji Pokok Saat Ini",
    cell: ({ row }) => {
      const current = row.original.currentSalary
      if (!current) {
        return <span className="text-muted-foreground italic">Belum diatur</span>
      }
      return (
        <div className="font-semibold text-green-600">
          {formatIDR(current.baseSalary)}
        </div>
      )
    },
  },
  {
    accessorKey: "effectiveDate",
    header: "Berlaku Sejak",
    cell: ({ row }) => {
      const current = row.original.currentSalary
      if (!current) return "-"
      return (
        <div className="text-sm">
          {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(current.effectiveDate))}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const staff = row.original
      const staffName = `${staff.firstName} ${staff.lastName}`
      const current = staff.currentSalary

      return (
        <div className="flex justify-end">
          <StaffSalaryDialog
            staffId={staff.id}
            staffName={staffName}
            initialData={current ? {
              id: current.id,
              staffId: staff.id,
              baseSalary: current.baseSalary,
              effectiveDate: new Date(current.effectiveDate),
            } : undefined}
          />
        </div>
      )
    },
  },
]
