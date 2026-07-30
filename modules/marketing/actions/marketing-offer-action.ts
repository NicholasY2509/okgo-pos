"use server"

import { revalidatePath } from "next/cache"
import { marketingOfferSchema, type MarketingOfferInput } from "../schemas/marketing-offer"
import { MarketingOfferService } from "../services/marketing-offer-service"

export async function createMarketingOfferAction(values: MarketingOfferInput) {
  try {
    const validatedFields = marketingOfferSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data formulir tidak valid." }
    }

    const result = await MarketingOfferService.create(validatedFields.data)
    
    revalidatePath("/admin/marketing")
    revalidatePath("/") // Revalidate the marketing landing page
    
    return { success: true, data: result }
  } catch (error: any) {
    console.error("Failed to create marketing offer:", error)
    return { error: error?.message || "Terjadi kesalahan tak terduga." }
  }
}

export async function updateMarketingOfferAction(id: string, values: MarketingOfferInput) {
  try {
    const validatedFields = marketingOfferSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data formulir tidak valid." }
    }

    const result = await MarketingOfferService.update(id, validatedFields.data)
    
    revalidatePath("/admin/marketing")
    revalidatePath("/") // Revalidate the marketing landing page
    
    return { success: true, data: result }
  } catch (error: any) {
    console.error("Failed to update marketing offer:", error)
    return { error: error?.message || "Terjadi kesalahan tak terduga." }
  }
}

export async function deleteMarketingOfferAction(id: string) {
  try {
    await MarketingOfferService.delete(id)
    
    revalidatePath("/admin/marketing")
    revalidatePath("/") // Revalidate the marketing landing page
    
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete marketing offer:", error)
    return { error: error?.message || "Terjadi kesalahan tak terduga." }
  }
}

export async function getActiveOffersAction() {
  try {
    const offers = await MarketingOfferService.findActive()
    const serialized = offers.map(offer => ({
      ...offer,
      normalPrice: offer.normalPrice ? Number(offer.normalPrice) : null,
      discountPrice: Number(offer.discountPrice),
    }))
    return { success: true, data: serialized }
  } catch (error: any) {
    console.error("Failed to fetch active offers:", error)
    return { error: "Terjadi kesalahan saat memuat penawaran." }
  }
}
