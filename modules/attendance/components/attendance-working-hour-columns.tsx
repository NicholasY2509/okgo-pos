"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { deleteAttendanceWorkingHourAction } from "../actions/attendance-working-hour-action"
import { toast } from "sonner"
import { format } from "date-fns"

export type AttendanceWorkingHourData = {
  id: string
  attendanceDate: Date
  staff: {
    id: string
    firstName: string
    lastName: string
  }
  workingHour: {
    id: string
    name: string
    clockIn: string
    clockOut: string
  }
}

export const getAttendanceWorkingHourColumns = (
  onDeleteClick: (schedule: AttendanceWorkingHourData) => void
): ColumnDef<AttendanceWorkingHourData>[] => [
    {
      accessorKey: "attendanceDate",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.attendanceDate), "dd MMM yyyy")
    },
    {
      accessorKey: "staff",
      header: "Staff Name",
      cell: ({ row }) => `${row.original.staff.firstName} ${row.original.staff.lastName}`
    },
    {
      accessorKey: "workingHour",
      header: "Shift",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.workingHour.name}</span>
          <span className="text-muted-foreground text-xs">{row.original.workingHour.clockIn} - {row.original.workingHour.clockOut}</span>
        </div>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const schedule = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDeleteClick(schedule)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]
