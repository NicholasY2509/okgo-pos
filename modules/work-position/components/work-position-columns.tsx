"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatDate } from "@/lib/utils"
import { useState } from "react"
import { MoreHorizontal, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WorkPositionEditForm } from "./work-position-edit-form"

export type WorkPositionData = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  _count: {
    staff: number
  }
}

function ActionCell({ position }: { position: WorkPositionData }) {
  const [isEditOpen, setIsEditOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Posisi Kerja</DialogTitle>
            <DialogDescription>
              Perbarui informasi posisi kerja/peran ini.
            </DialogDescription>
          </DialogHeader>
          <WorkPositionEditForm 
            initialData={{
              id: position.id,
              name: position.name,
              description: position.description || "",
            }}
            onSuccess={() => setIsEditOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export const workPositionColumns: ColumnDef<WorkPositionData>[] = [
  {
    accessorKey: "name",
    header: "Nama Posisi",
  },
  {
    accessorKey: "description",
    header: "Deskripsi",
    cell: ({ row }) => row.original.description || "-",
  },
  {
    id: "staffCount",
    header: "Jumlah Staf",
    cell: ({ row }) => row.original._count.staff,
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Pada",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell position={row.original} />,
  },
]
