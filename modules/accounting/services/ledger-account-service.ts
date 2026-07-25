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

  static async getById(id: string) {
    return await LedgerAccountRepository.findById(id)
  }

  static async update(id: string, data: Partial<LedgerAccountInput>) {
    return await LedgerAccountRepository.update(id, data)
  }

  static async delete(id: string) {
    // Might want to check if there are journal lines before deleting
    return await LedgerAccountRepository.delete(id)
  }
}
