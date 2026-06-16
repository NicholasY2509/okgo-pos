"use server"

import { revalidatePath } from "next/cache"
import { ProductService } from "../services/product-service"
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "../schemas/product-schema"

export async function createProductAction(values: CreateProductInput) {
  try {
    const validatedFields = createProductSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid data." }
    }

    const product = await ProductService.createProduct(validatedFields.data)
    revalidatePath("/admin/products")
    return { success: true, data: product }
  } catch (error) {
    console.error("Failed to create product:", error)
    return { error: "Failed to create product." }
  }
}

export async function updateProductAction(values: UpdateProductInput) {
  try {
    const validatedFields = updateProductSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid data." }
    }

    const { id, ...data } = validatedFields.data
    const product = await ProductService.updateProduct(id, data)
    revalidatePath("/admin/products")
    return { success: true, data: product }
  } catch (error) {
    console.error("Failed to update product:", error)
    return { error: "Failed to update product." }
  }
}

export async function deleteProductAction(id: string) {
  try {
    await ProductService.deleteProduct(id)
    revalidatePath("/admin/products")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete product:", error)
    return { error: "Failed to delete product." }
  }
}
