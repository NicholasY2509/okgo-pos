import { JournalEntryRepository } from "../repositories/journal-entry-repository"
import { JournalEntryInput } from "../schemas/journal-entry"
import { BranchRepository } from "@/modules/branch/repositories/branch-repository"

async function enrichWithBranches<T extends { branchId?: string | null }>(entries: T[]) {
  const branchIds = Array.from(
    new Set(
      entries
        .map((e) => e.branchId)
        .filter((id): id is string => Boolean(id))
    )
  )

  if (branchIds.length === 0) {
    return entries.map((e) => ({
      ...e,
      branch: null,
      branchName: null,
    }))
  }

  const branches = await BranchRepository.getBranchesByIds(branchIds)
  const branchMap = new Map(branches.map((b) => [b.id, b]))

  return entries.map((e) => {
    const branch = e.branchId ? branchMap.get(e.branchId) ?? null : null
    return {
      ...e,
      branch,
      branchName: branch ? branch.name : null,
    }
  })
}

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
    const result = await JournalEntryRepository.findAll(options)
    const enrichedData = await enrichWithBranches(result.data)
    return {
      ...result,
      data: enrichedData,
    }
  }

  static async getById(id: string) {
    const entry = await JournalEntryRepository.findById(id)
    if (!entry) return null

    let branch = null
    if (entry.branchId) {
      branch = await BranchRepository.getBranchById(entry.branchId)
    }

    return {
      ...entry,
      branch,
      branchName: branch ? branch.name : null,
    }
  }

  static async delete(id: string) {
    // Only allow deletion if it meets certain business conditions, e.g., it's not closed
    return await JournalEntryRepository.delete(id)
  }

  static async getByAccountId(accountId: string, branchId?: string, tenantId?: string) {
    const entries = await JournalEntryRepository.findByAccountId(accountId, branchId, tenantId)
    return await enrichWithBranches(entries)
  }

  static async getExpenseEntries(options: { branchId?: string, tenantId?: string, page?: number, limit?: number, startDate?: Date, endDate?: Date }) {
    const result = await JournalEntryRepository.findExpenseEntries(options)
    const enrichedData = await enrichWithBranches(result.data)
    return {
      ...result,
      data: enrichedData,
    }
  }
}
