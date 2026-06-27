"use server"

import { CustomerVoucherService } from "../services/customer-voucher-service"

export async function getCustomerVouchersAction(customerId: string) {
  try {
    const vouchers = await CustomerVoucherService.getByCustomerId(customerId)
    return { success: true, data: vouchers }
  } catch (error) {
    console.error("Error fetching customer vouchers:", error)
    return { error: "Failed to fetch customer vouchers" }
  }
}

export async function getVoucherByCodeAction(code: string) {
  try {
    const voucher = await CustomerVoucherService.getByCode(code)
    if (!voucher) {
      return { error: "Voucher tidak ditemukan" }
    }
    if (voucher.status !== "ACTIVE") {
      let friendlyMessage = `Voucher tidak dapat digunakan (Status: ${voucher.status})`;
      if (voucher.status === "USED_UP") {
        friendlyMessage = "Voucher ini sudah habis digunakan.";
      } else if (voucher.status === "EXPIRED") {
        friendlyMessage = "Voucher ini sudah kedaluwarsa.";
      } else if (voucher.status === "VOID") {
        friendlyMessage = "Voucher ini sudah dibatalkan.";
      }
      return { error: friendlyMessage };
    }
    return { success: true, data: voucher }
  } catch (error) {
    console.error("Error fetching voucher by code:", error)
    return { error: "Failed to fetch voucher" }
  }
}
