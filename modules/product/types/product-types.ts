import { Prisma } from "@/lib/generated/prisma"

export type Product = Omit<
  Prisma.ProductGetPayload<Record<string, never>>,
  "price"
> & {
  price: number | Prisma.Decimal
}

export type ProductWithCategory = Omit<
  Prisma.ProductGetPayload<{
    include: {
      category: true
    }
  }>,
  "price"
> & {
  price: number | Prisma.Decimal
}

export type Category = Prisma.CategoryGetPayload<Record<string, never>>

export type WorkPositionItem = Prisma.WorkPositionGetPayload<Record<string, never>>

export type CategoryWithRelations = Category & {
  targetWorkPosition?: WorkPositionItem | null
  _count?: {
    products?: number
  }
}
