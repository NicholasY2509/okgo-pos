"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { CategoryDialog } from "./category-dialog"
import { Edit } from "lucide-react"

export const getCategoriesColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "name",
    header: "Nama",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name") as string}</div>
  },
  {
    accessorKey: "description",
    header: "Deskripsi",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null
      return (
        <div className="text-muted-foreground max-w-[300px] truncate">
          {description || "-"}
        </div>
      )
    }
  },
  {
    accessorKey: "servicesCount",
    header: "Jumlah Layanan",
    cell: ({ row }) => {
      const count = row.original._count?.products || 0
      return <div>{count} layanan</div>
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-4">Aksi</div>,
    cell: ({ row }) => {
      const category = row.original
      return (
        <div className="text-right">
          <CategoryDialog initialData={category}>
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </CategoryDialog>
        </div>
      )
    }
  }
]
