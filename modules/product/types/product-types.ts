import { Prisma } from "@/lib/generated/prisma"

export type Product = Prisma.ProductGetPayload<{}>

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: {
    category: true
  }
}>

export type Category = Prisma.CategoryGetPayload<{}>
