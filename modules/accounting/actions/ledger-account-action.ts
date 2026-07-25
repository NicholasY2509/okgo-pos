"use server"

import { ledgerAccountSchema, type LedgerAccountInput } from "../schemas/ledger-account"
import { LedgerAccountService } from "../services/ledger-account-service"
import { revalidatePath } from "next/cache"
import { auth } from "@/modules/auth/auth" // Adjust based on your auth setup

export async function createLedgerAccountAction(values: LedgerAccountInput) {
  try {
    const validatedFields = ledgerAccountSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Invalid form data." }
    }

    const result = await LedgerAccountService.create(validatedFields.data, undefined)
    revalidatePath("/[tenant]/(main)/accounting/coa", "page")
    
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." }
  }
}

export async function getLedgerAccountsAction() {
  try {
    const accounts = await LedgerAccountService.getAll(undefined)
    return { success: true, data: accounts }
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." }
  }
}
