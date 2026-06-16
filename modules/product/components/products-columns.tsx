"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductDialog } from "./product-dialog"
import { Edit, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatIDR } from "@/lib/utils"

export const getProductsColumns = (categories: any[]): ColumnDef<any>[] => [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const image = row.getValue("image") as string | null
      const name = row.getValue("name") as string
      return (
        <div className="h-10 w-10 relative rounded-md overflow-hidden bg-muted flex items-center justify-center border">
          {image ? (
            <Image src={image} alt={name} fill className="object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
      )
    }
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      const description = row.original.description
      return (
        <div className="font-medium">
          <div>{name}</div>
          {description && (
            <div className="text-xs text-muted-foreground line-clamp-1">{description}</div>
          )}
        </div>
      )
    }
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as { name: string } | null
      return category ? category.name : <span className="text-muted-foreground italic">None</span>
    }
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("price") as number
      return formatIDR(price)
    }
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const duration = row.getValue("duration") as number | null
      return duration ? `${duration} min` : "-"
    }
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-4">Actions</div>,
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="flex justify-end gap-2">
          <ProductDialog initialData={product} categories={categories}>
            <Button variant="ghost" size="icon" title="Edit Product">
              <Edit className="h-4 w-4" />
            </Button>
          </ProductDialog>
          <Button variant="ghost" size="icon" asChild title="View Details">
            <Link href={`/products/${product.id}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )
    }
  }
]
