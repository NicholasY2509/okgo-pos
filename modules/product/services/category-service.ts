import type { CreateCategoryInput, UpdateCategoryInput } from "../schemas/category-schema"
import { CategoryRepository } from "../repositories/category-repository"

export class CategoryService {
  static async getAllCategories() {
    return await CategoryRepository.getAllCategories()
  }

  static async getCategoryById(id: string) {
    return await CategoryRepository.getCategoryById(id)
  }

  static async createCategory(data: CreateCategoryInput) {
    return await CategoryRepository.createCategory(data)
  }

  static async updateCategory(id: string, data: Omit<UpdateCategoryInput, "id">) {
    return await CategoryRepository.updateCategory(id, data)
  }

  static async deleteCategory(id: string) {
    return await CategoryRepository.deleteCategory(id)
  }
}
