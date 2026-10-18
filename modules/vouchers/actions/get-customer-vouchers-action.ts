"use server"

import { CustomerVoucherService } from "../services/customer-voucher-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function getCustomerVouchersAction(customerId: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const vouchers = await CustomerVoucherService.getByCustomerId(customerId)
    return { success: true, data: vouchers }
  } catch (error: unknown) {
    console.error("Error fetching customer vouchers:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch customer vouchers"
    return { error: message }
  }
}

export async function getVoucherByCodeAction(code: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const voucher = await CustomerVoucherService.getByCode(code)
    if (!voucher) {
      return { error: "Voucher tidak ditemukan" }
    }
    if (voucher.status !== "ACTIVE") {
      let friendlyMessage = `Voucher tidak dapat digunakan (Status: ${voucher.status})`
      if (voucher.status === "USED_UP") {
        friendlyMessage = "Voucher ini sudah habis digunakan."
      } else if (voucher.status === "EXPIRED") {
        friendlyMessage = "Voucher ini sudah kedaluwarsa."
      } else if (voucher.status === "VOID") {
        friendlyMessage = "Voucher ini sudah dibatalkan."
      }
      return { error: friendlyMessage }
    }
    return { success: true, data: voucher }
  } catch (error: unknown) {
    console.error("Error fetching voucher by code:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch voucher"
    return { error: message }
  }
}
