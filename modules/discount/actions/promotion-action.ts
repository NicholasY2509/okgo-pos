"use server"

import { revalidatePath } from "next/cache"
import { promotionSchema, type PromotionInput } from "../schemas/promotion"
import { PromotionService, type CartItem } from "../services/promotion-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function createPromotionAction(values: PromotionInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = promotionSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await PromotionService.createPromotion(validatedFields.data)
    revalidatePath("/admin/products")
    return { success: true, data: result }
  } catch (error: unknown) {
    console.error("Failed to create promotion:", error)
    return { error: "Terjadi kesalahan tak terduga." }
  }
}

export async function updatePromotionAction(id: string, values: PromotionInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = promotionSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await PromotionService.updatePromotion(id, validatedFields.data)
    revalidatePath("/admin/products")
    return { success: true, data: result }
  } catch (error: unknown) {
    console.error("Failed to update promotion:", error)
    return { error: "Terjadi kesalahan tak terduga." }
  }
}

export async function deletePromotionAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    await PromotionService.deletePromotion(id)
    revalidatePath("/admin/products")
    return { success: true }
  } catch (error: unknown) {
    console.error("Failed to delete promotion:", error)
    return { error: "Terjadi kesalahan tak terduga." }
  }
}

export async function getEligiblePromotionsAction(cartItems: CartItem[], branchId: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const eligiblePromos = await PromotionService.getEligiblePromotions(cartItems, branchId)
    return { success: true, data: eligiblePromos }
  } catch (error: unknown) {
    console.error("Failed to get eligible promotions:", error)
    return { error: "Gagal memuat daftar promo." }
  }
}
