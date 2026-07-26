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

  async findAllWithBalances(tenantId?: string) {
    const accounts = await prisma.ledgerAccount.findMany({
      where: { tenantId },
      orderBy: { code: "asc" },
    });

    const lines = await prisma.journalLine.groupBy({
      by: ['ledgerAccountId'],
      _sum: {
        debit: true,
        credit: true,
      }
    });

    return accounts.map(acc => {
      const agg = lines.find(l => l.ledgerAccountId === acc.id);
      const debit = Number(agg?._sum.debit || 0);
      const credit = Number(agg?._sum.credit || 0);
      let balance = 0;
      
      // Calculate normal balance
      if (['ASSET', 'EXPENSE'].includes(acc.type)) {
        balance = debit - credit;
      } else {
        balance = credit - debit;
      }

      return {
        ...acc,
        balance,
      };
    });
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
