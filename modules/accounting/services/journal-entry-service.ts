import { JournalEntryRepository } from "../repositories/journal-entry-repository"
import { JournalEntryInput } from "../schemas/journal-entry"

export class JournalEntryService {
  static async create(data: JournalEntryInput, tenantId?: string) {
    // Business rules could go here, e.g., validating the ledgerAccountId exists
    return await JournalEntryRepository.create({ ...data, tenantId })
  }

  static async getAllByBranch(branchId?: string, tenantId?: string) {
    if (branchId) {
      return await JournalEntryRepository.findAll(branchId, tenantId)
    }
    // If no branch, fetch all for tenant
    return await JournalEntryRepository.findAll(undefined, tenantId)
  }

  static async getById(id: string) {
    return await JournalEntryRepository.findById(id)
  }

  static async delete(id: string) {
    // Only allow deletion if it meets certain business conditions, e.g., it's not closed
    return await JournalEntryRepository.delete(id)
  }
}
