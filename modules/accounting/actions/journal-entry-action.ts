"use server"

import { journalEntrySchema, type JournalEntryInput } from "../schemas/journal-entry"
import { JournalEntryService } from "../services/journal-entry-service"
import { revalidatePath } from "next/cache"
import { auth } from "@/modules/auth/auth"

export async function createJournalEntryAction(values: JournalEntryInput) {
  try {
    const validatedFields = journalEntrySchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Invalid form data.", details: validatedFields.error.flatten() }
    }

    const result = await JournalEntryService.create(validatedFields.data, undefined)
    revalidatePath("/[tenant]/(main)/accounting/journal", "page")

    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." }
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
    const entries = await JournalEntryService.getAllByBranch({ ...options, tenantId: undefined })
    return { success: true, data: entries.data, metadata: entries.metadata }
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." }
  }
}

export async function getJournalEntryByIdAction(id: string) {
  try {
    const entry = await JournalEntryService.getById(id)
    if (!entry) return { error: "Journal entry not found" }
    return { success: true, data: entry }
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." }
  }
}

export async function getJournalEntriesByAccountAction(accountId: string, branchId?: string) {
  try {
    const entries = await JournalEntryService.getByAccountId(accountId, branchId, undefined)
    return { success: true, data: entries }
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." }
  }
}

export async function getExpenseEntriesAction(options: JournalFilterOptions = {}) {
  try {
    const entries = await JournalEntryService.getExpenseEntries({ ...options, tenantId: undefined })
    return { success: true, data: entries.data, metadata: entries.metadata }
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." }
  }
}


