"use server"

import { ledgerAccountSchema, type LedgerAccountInput } from "../schemas/ledger-account"
import { LedgerAccountService } from "../services/ledger-account-service"
import { revalidatePath } from "next/cache"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function createLedgerAccountAction(values: LedgerAccountInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = ledgerAccountSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Invalid form data." }
    }

    const result = await LedgerAccountService.create(validatedFields.data, authCheck.session.user.id)
    revalidatePath("/[tenant]/(main)/accounting/coa", "page")

    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return { error: message }
  }
}

export async function getLedgerAccountsAction(tenantId?: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const accounts = await LedgerAccountService.getAll(tenantId)
    return { success: true, data: accounts }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return { error: message }
  }
}

export async function getLedgerAccountsWithBalancesAction(tenantId?: string, branchId?: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const accounts = await LedgerAccountService.getAllWithBalances(tenantId, branchId)
    return { success: true, data: accounts }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return { error: message }
  }
}

export async function updateLedgerAccountAction(id: string, values: Partial<LedgerAccountInput>) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const partialSchema = ledgerAccountSchema.partial()
    const validatedFields = partialSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid form data." }
    }

    const result = await LedgerAccountService.update(id, validatedFields.data)

    revalidatePath("/[tenant]/(main)/accounting/coa", "page")
    revalidatePath("/admin/(dashboard)/accounting/coa", "page")

    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return { error: message }
  }
}
