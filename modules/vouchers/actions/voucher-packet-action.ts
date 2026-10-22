"use server"

import { revalidatePath } from "next/cache"
import { voucherPacketSchema, type VoucherPacketInput } from "../schemas/voucher-packet"
import { VoucherPacketService } from "../services/voucher-packet-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function createVoucherPacketAction(values: VoucherPacketInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

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
  } catch (error: unknown) {
    console.error("Failed to create voucher packet:", error)
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga."
    return { error: message }
  }
}

export async function updateVoucherPacketAction(id: string, values: VoucherPacketInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

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
  } catch (error: unknown) {
    console.error("Failed to update voucher packet:", error)
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga."
    return { error: message }
  }
}

export async function deleteVoucherPacketAction(id: string, productId: string) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    await VoucherPacketService.delete(id)

    revalidatePath(`/dashboard/products/${productId}`)
    revalidatePath("/dashboard/vouchers")

    return { success: true }
  } catch (error: unknown) {
    console.error("Failed to delete voucher packet:", error)
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga."
    return { error: message }
  }
}

export async function generateVouchersAction(packetId: string, quantity: number) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const result = await VoucherPacketService.generateVouchers(packetId, quantity)
    revalidatePath("/admin/vouchers")
    return { success: true, count: result.length }
  } catch (error: unknown) {
    console.error("Failed to generate vouchers:", error)
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga."
    return { error: message }
  }
}
