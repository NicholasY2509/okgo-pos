import { prisma } from "@/lib/prisma"
import type { CreateCategoryInput, UpdateCategoryInput } from "../schemas/category-schema"

export class CategoryService {
  static async getAllCategories() {
    return await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })
  }

  static async getCategoryById(id: string) {
    return await prisma.category.findUnique({
      where: { id },
    })
  }

  static async createCategory(data: CreateCategoryInput) {
    return await prisma.category.create({
      data,
    })
  }

  static async updateCategory(id: string, data: Omit<UpdateCategoryInput, "id">) {
    return await prisma.category.update({
      where: { id },
      data,
    })
  }

  static async deleteCategory(id: string) {
    return await prisma.category.delete({
      where: { id },
    })
  }
}
