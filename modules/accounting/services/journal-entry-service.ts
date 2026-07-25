import { JournalEntryRepository } from "../repositories/journal-entry-repository"
import { JournalEntryInput } from "../schemas/journal-entry"

export class JournalEntryService {
  static async create(data: JournalEntryInput, tenantId?: string) {
    let reference = data.reference;
    if (!reference || reference.trim() === "") {
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      reference = `JRN-${dateStr}-${randomPart}`;
    }

    return await JournalEntryRepository.create({ ...data, reference, tenantId })
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

  static async getByAccountId(accountId: string, branchId?: string, tenantId?: string) {
    return await JournalEntryRepository.findByAccountId(accountId, branchId, tenantId)
  }

  static async getExpenseEntries(branchId?: string, tenantId?: string) {
    return await JournalEntryRepository.findExpenseEntries(branchId, tenantId)
  }
}
