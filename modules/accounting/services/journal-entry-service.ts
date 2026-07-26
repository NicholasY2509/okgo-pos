import { JournalEntryRepository } from "../repositories/journal-entry-repository"
import { JournalEntryInput } from "../schemas/journal-entry"

export class JournalEntryService {
  static async create(data: JournalEntryInput, tenantId?: string) {
    let reference = data.reference;
    
    // Ensure empty string is converted to undefined so Prisma doesn't save empty strings
    if (reference && reference.trim() === "") {
      reference = undefined;
    }

    return await JournalEntryRepository.create({ ...data, reference, tenantId })
  }

  static async getAllByBranch(options: { branchId?: string, tenantId?: string, page?: number, limit?: number, startDate?: Date, endDate?: Date }) {
    return await JournalEntryRepository.findAll(options)
  }

  static async getById(id: string) {
    return await JournalEntryRepository.findById(id)
  }

  static async delete(id: string) {
    // Only allow deletion if it meets certain business conditions, e.g., it's not closed
    return await JournalEntryRepository.delete(id)
  }

  static async getByAccountId(accountId: string, branchId?: string, tenantId?: string) {
    return await JournalEntryRepository.findByAccountId(accountId, branchId, tenantId)
  }

  static async getExpenseEntries(options: { branchId?: string, tenantId?: string, page?: number, limit?: number, startDate?: Date, endDate?: Date }) {
    return await JournalEntryRepository.findExpenseEntries(options)
  }
}
