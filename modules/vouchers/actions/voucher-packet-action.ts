"use server"

import { revalidatePath } from "next/cache"
import { voucherPacketSchema, type VoucherPacketInput } from "../schemas/voucher-packet"
import { VoucherPacketService } from "../services/voucher-packet-service"

export async function createVoucherPacketAction(values: VoucherPacketInput) {
  try {
    const validatedFields = voucherPacketSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data formulir tidak valid." }
    }

    const result = await VoucherPacketService.create(validatedFields.data)
    
    // Revalidate paths where this data might be displayed
    revalidatePath(`/dashboard/products/${result.productId}`)
    revalidatePath("/dashboard/vouchers")
    
    return { 
      success: true, 
      data: {
        ...result,
        price: Number(result.price)
      } 
    }
  } catch (error: any) {
    console.error("Failed to create voucher packet:", error)
    return { error: error?.message || "Terjadi kesalahan tak terduga." }
  }
}

export async function updateVoucherPacketAction(id: string, values: VoucherPacketInput) {
  try {
    const validatedFields = voucherPacketSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data formulir tidak valid." }
    }

    const result = await VoucherPacketService.update(id, validatedFields.data)
    
    revalidatePath(`/dashboard/products/${result.productId}`)
    revalidatePath("/dashboard/vouchers")
    
    return { 
      success: true, 
      data: {
        ...result,
        price: Number(result.price)
      } 
    }
  } catch (error: any) {
    console.error("Failed to update voucher packet:", error)
    return { error: error?.message || "Terjadi kesalahan tak terduga." }
  }
}

export async function deleteVoucherPacketAction(id: string, productId: string) {
  try {
    await VoucherPacketService.delete(id)
    
    revalidatePath(`/dashboard/products/${productId}`)
    revalidatePath("/dashboard/vouchers")
    
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete voucher packet:", error)
    return { error: error?.message || "Terjadi kesalahan tak terduga." }
  }
}
