import { prisma } from "@/lib/prisma"
import type { CreateProductInput, UpdateProductInput } from "../schemas/product-schema"

export class ProductService {
  static async getAllProducts() {
    return await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        category: true,
      },
    })
  }

  static async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })
  }

  static async createProduct(data: CreateProductInput) {
    return await prisma.product.create({
      data,
    })
  }

  static async updateProduct(id: string, data: Omit<UpdateProductInput, "id">) {
    return await prisma.product.update({
      where: { id },
      data,
    })
  }

  static async deleteProduct(id: string) {
    return await prisma.product.delete({
      where: { id },
    })
  }
}
