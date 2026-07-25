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

export async function getJournalEntriesAction(branchId?: string) {
  try {
    const entries = await JournalEntryService.getAllByBranch(branchId, undefined)
    return { success: true, data: entries }
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." }
  }
}
