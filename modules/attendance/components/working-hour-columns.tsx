"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { deleteWorkingHourAction } from "../actions/working-hour-action"
import { toast } from "sonner"
import { WorkingHourDialog } from "./working-hour-dialog"

export type WorkingHourData = {
  id: string
  name: string
  clockIn: string
  clockOut: string
}

export const workingHourColumns: ColumnDef<WorkingHourData>[] = [
  {
    accessorKey: "name",
    header: "Shift Name",
  },
  {
    accessorKey: "clockIn",
    header: "Clock In",
  },
  {
    accessorKey: "clockOut",
    header: "Clock Out",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const wh = row.original
      const [isEditOpen, setIsEditOpen] = useState(false)
      const [isDeleting, setIsDeleting] = useState(false)

      async function handleDelete() {
        if (!confirm("Are you sure you want to delete this template?")) return
        setIsDeleting(true)
        const result = await deleteWorkingHourAction(wh.id)
        setIsDeleting(false)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Successfully deleted template.")
        }
      }

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <WorkingHourDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            initialData={wh}
          />
        </>
      )
    }
  }
]
