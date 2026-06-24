"use server"

import { revalidatePath } from "next/cache"
import { discountSchema, type DiscountInput } from "../schemas/discount"
import { DiscountService } from "../services/discount-service"

export async function createDiscountAction(values: DiscountInput) {
  try {
    const validatedFields = discountSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await DiscountService.createDiscount(validatedFields.data)
    revalidatePath("/admin/products")
    return { 
      success: true, 
      data: { ...result, percentage: Number(result.percentage) } 
    }
  } catch (error) {
    console.error("Failed to create discount:", error)
    return { error: "Terjadi kesalahan tak terduga." }
  }
}

export async function updateDiscountAction(id: string, values: DiscountInput) {
  try {
    const validatedFields = discountSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await DiscountService.updateDiscount(id, validatedFields.data)
    revalidatePath("/admin/products")
    return { 
      success: true, 
      data: { ...result, percentage: Number(result.percentage) } 
    }
  } catch (error) {
    console.error("Failed to update discount:", error)
    return { error: "Terjadi kesalahan tak terduga." }
  }
}

export async function deleteDiscountAction(id: string) {
  try {
    await DiscountService.deleteDiscount(id)
    revalidatePath("/admin/products")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete discount:", error)
    return { error: "Terjadi kesalahan tak terduga." }
  }
}
