import { LedgerAccountRepository } from "../repositories/ledger-account-repository"
import { LedgerAccountInput } from "../schemas/ledger-account"

export class LedgerAccountService {
  static async create(data: LedgerAccountInput, tenantId?: string) {
    const existing = await LedgerAccountRepository.findByCode(data.code, tenantId)
    if (existing) {
      throw new Error("Account with this code already exists.")
    }
    return await LedgerAccountRepository.create({ ...data, tenantId })
  }

  static async getAll(tenantId?: string) {
    return await LedgerAccountRepository.findAll(tenantId)
  }

  static async getAllWithBalances(tenantId?: string) {
    return await LedgerAccountRepository.findAllWithBalances(tenantId)
  }

  static async getById(id: string) {
    return await LedgerAccountRepository.findById(id)
  }

  static async update(id: string, data: Partial<LedgerAccountInput>) {
    const existing = await LedgerAccountRepository.findById(id)
    if (!existing) throw new Error("Account not found.")
    
    // If account is locked, we only allow updating the description or isLocked status itself.
    // Changing code, name, or type is forbidden.
    if (existing.isLocked) {
      if (data.code && data.code !== existing.code) throw new Error("Cannot change code of a locked account.")
      if (data.type && data.type !== existing.type) throw new Error("Cannot change type of a locked account.")
      // We'll allow name change or description change for flexibility, or maybe block name too?
      // "shouldnt be edited" usually means critical fields. Let's block name too.
      if (data.name && data.name !== existing.name) throw new Error("Cannot change name of a locked account.")
    }

    return await LedgerAccountRepository.update(id, data)
  }

  static async delete(id: string) {
    const existing = await LedgerAccountRepository.findById(id)
    if (!existing) throw new Error("Account not found.")
    if (existing.isLocked) {
      throw new Error("Cannot delete a locked account.")
    }
    return await LedgerAccountRepository.delete(id)
  }
}
