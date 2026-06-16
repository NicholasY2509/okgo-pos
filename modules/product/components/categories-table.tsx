"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { CategoryDialog } from "./category-dialog"
import { getCategoriesColumns } from "./categories-columns"

interface CategoriesTableProps {
  categories: any[]
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  if (categories.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed rounded-xl bg-card">
        <h3 className="text-lg font-medium">No categories found</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first category to group services.</p>
        <CategoryDialog />
      </div>
    )
  }

  const columns = useMemo(() => getCategoriesColumns(), [])

  return <DataTable columns={columns} data={categories} emptyMessage="No categories found." />
}
