"use server"

import { revalidatePath } from "next/cache"
import { ProductService } from "../services/product-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "../schemas/product-schema"

export async function createProductAction(values: CreateProductInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = createProductSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const product = await ProductService.createProduct(validatedFields.data)
    revalidatePath("/admin/products")
    return { success: true, data: product }
  } catch (error) {
    console.error("Failed to create product:", error)
    return { error: "Gagal membuat produk." }
  }
}

export async function updateProductAction(values: UpdateProductInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }
    const validatedFields = updateProductSchema.safeParse(values)

    if (!validatedFields.success) {
      console.log("Validation failed:", validatedFields.error)
      return { error: "Data tidak valid." }
    }

    const { id, ...data } = validatedFields.data
    const product = await ProductService.updateProduct(id, data)
    revalidatePath("/admin/products")
    return { success: true, data: product }
  } catch (error: unknown) {
    console.error("Failed to update product:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return { error: `Gagal memperbarui produk: ${message}` }
  }
}

export async function deleteProductAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    await ProductService.deleteProduct(id)
    revalidatePath("/admin/products")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete product:", error)
    return { error: "Gagal menghapus produk." }
  }
}

export async function toggleProductMarketingAction(id: string, showOnMarketing: boolean) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    await ProductService.toggleMarketingStatus(id, showOnMarketing)
    revalidatePath("/admin/marketing")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle marketing status:", error)
    return { error: "Gagal memperbarui status pemasaran." }
  }
}

export async function getFeaturedProductsAction() {
  try {
    const products = await ProductService.findFeaturedProducts()
    const serialized = products.map(p => ({
      ...p,
      price: Number(p.price),
    }))
    return { success: true, data: serialized }
  } catch (error) {
    console.error("Failed to fetch featured products:", error)
    return { error: "Gagal memuat layanan unggulan." }
  }
}

export async function getAllProductsListAction() {
  try {
    // Just fetch up to 1000 products for the combobox
    const result = await ProductService.getAllProducts({ page: 1, limit: 1000 });
    return { success: true, data: result.products };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat produk";
    return { error: message };
  }
}
