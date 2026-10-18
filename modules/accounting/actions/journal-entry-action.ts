"use server"

import { journalEntrySchema, type JournalEntryInput } from "../schemas/journal-entry"
import { JournalEntryService } from "../services/journal-entry-service"
import { revalidatePath } from "next/cache"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function createJournalEntryAction(values: JournalEntryInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = journalEntrySchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Invalid form data.", details: validatedFields.error.flatten() }
    }

    const result = await JournalEntryService.create(validatedFields.data, authCheck.session.user.id)
    revalidatePath("/[tenant]/(main)/accounting/journal", "page")

    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return { error: message }
  }
}

interface JournalFilterOptions {
  branchId?: string
  page?: number
  limit?: number
  startDate?: Date
  endDate?: Date
}

export async function getJournalEntriesAction(options: JournalFilterOptions = {}) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const entries = await JournalEntryService.getAllByBranch({ ...options, tenantId: undefined })
    return { success: true, data: entries.data, metadata: entries.metadata }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return { error: message }
  }
}

export async function getJournalEntryByIdAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const entry = await JournalEntryService.getById(id)
    if (!entry) return { error: "Journal entry not found" }
    return { success: true, data: entry }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return { error: message }
  }
}

export async function getJournalEntriesByAccountAction(accountId: string, branchId?: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const entries = await JournalEntryService.getByAccountId(accountId, branchId, undefined)
    return { success: true, data: entries }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return { error: message }
  }
}

export async function getExpenseEntriesAction(options: JournalFilterOptions = {}) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const entries = await JournalEntryService.getExpenseEntries({ ...options, tenantId: undefined })
    return { success: true, data: entries.data, metadata: entries.metadata }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return { error: message }
  }
}
