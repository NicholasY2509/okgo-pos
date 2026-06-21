"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { ProductDialog } from "./product-dialog"
import { getProductsColumns } from "./products-columns"

interface ProductsTableProps {
  products: any[]
  categories: any[]
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed rounded-xl bg-card">
        <h3 className="text-lg font-medium">Layanan tidak ditemukan</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Tambahkan layanan atau produk pertama Anda.</p>
        <ProductDialog categories={categories} />
      </div>
    )
  }

  const columns = useMemo(() => getProductsColumns(categories), [categories])

  return <DataTable columns={columns} data={products} emptyMessage="Layanan tidak ditemukan." />
}
