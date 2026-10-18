"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { CategoryDialog } from "./category-dialog"
import { getCategoriesColumns } from "./categories-columns"
import type { CategoryWithRelations, WorkPositionItem } from "../types/product-types"

interface CategoriesTableProps {
  categories: CategoryWithRelations[]
  workPositions: WorkPositionItem[]
}

export function CategoriesTable({ categories, workPositions }: CategoriesTableProps) {
  const columns = useMemo(() => getCategoriesColumns(workPositions), [workPositions])

  if (categories.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed rounded-xl bg-card">
        <h3 className="text-lg font-medium">Kategori tidak ditemukan</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Buat kategori pertama Anda untuk mengelompokkan layanan.</p>
        <CategoryDialog workPositions={workPositions} />
      </div>
    )
  }

  return <DataTable columns={columns} data={categories} emptyMessage="Kategori tidak ditemukan." />
}
