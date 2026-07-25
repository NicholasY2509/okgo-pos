import { prisma } from "@/lib/prisma"
import { LedgerAccountInput } from "../schemas/ledger-account"

export const LedgerAccountRepository = {
  async create(data: LedgerAccountInput & { tenantId?: string }) {
    return await prisma.ledgerAccount.create({ data })
  },

  async findAll(tenantId?: string) {
    return await prisma.ledgerAccount.findMany({
      where: { tenantId },
      orderBy: { code: "asc" },
    })
  },

  async findById(id: string) {
    return await prisma.ledgerAccount.findUnique({
      where: { id },
    })
  },
  
  async findByCode(code: string, tenantId?: string) {
    return await prisma.ledgerAccount.findFirst({
      where: { code, tenantId },
    })
  },

  async update(id: string, data: Partial<LedgerAccountInput>) {
    return await prisma.ledgerAccount.update({
      where: { id },
      data,
    })
  },

  async delete(id: string) {
    return await prisma.ledgerAccount.delete({
      where: { id },
    })
  },
}
