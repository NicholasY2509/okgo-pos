import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma"
import type { CreateProductInput, UpdateProductInput } from "../schemas/product-schema"

export const ProductRepository = {
  async findManyWithFilter(where: Prisma.ProductWhereInput, skip: number, limit: number) {
    return await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        category: true,
      },
    })
  },

  async count(where: Prisma.ProductWhereInput) {
    return await prisma.product.count({ where })
  },

  async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })
  },

  async createProduct(data: CreateProductInput) {
    return await prisma.product.create({
      data,
    })
  },

  async updateProduct(id: string, data: Omit<UpdateProductInput, "id">) {
    return await prisma.product.update({
      where: { id },
      data,
    })
  },

  async deleteProduct(id: string) {
    return await prisma.product.delete({
      where: { id },
    })
  }
}
