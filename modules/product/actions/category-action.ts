"use server"

import { revalidatePath } from "next/cache"
import { CategoryService } from "../services/category-service"
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "../schemas/category-schema"

export async function createCategoryAction(values: CreateCategoryInput) {
  try {
    const validatedFields = createCategorySchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const category = await CategoryService.createCategory(validatedFields.data)
    revalidatePath("/admin/products")
    return { success: true, data: category }
  } catch (error) {
    console.error("Failed to create category:", error)
    return { error: "Gagal membuat kategori." }
  }
}

export async function updateCategoryAction(values: UpdateCategoryInput) {
  try {
    const validatedFields = updateCategorySchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const { id, ...data } = validatedFields.data
    const category = await CategoryService.updateCategory(id, data)
    revalidatePath("/admin/products")
    return { success: true, data: category }
  } catch (error) {
    console.error("Failed to update category:", error)
    return { error: "Gagal memperbarui kategori." }
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await CategoryService.deleteCategory(id)
    revalidatePath("/admin/products")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete category:", error)
    return { error: "Gagal menghapus kategori." }
  }
}
