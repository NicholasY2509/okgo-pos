import { prisma } from "@/lib/prisma"
import { JournalEntryInput } from "../schemas/journal-entry"
import { AccountingUtils } from "../services/accounting-utils"

export const JournalEntryRepository = {
  async create(data: JournalEntryInput & { tenantId?: string }) {
    return await prisma.journalEntry.create({
      data: {
        journalNumber: AccountingUtils.generateJournalNumber(),
        date: data.date,
        description: data.description,
        reference: data.reference,
        branchId: data.branchId,
        tenantId: data.tenantId,
        lines: {
          create: data.lines.map(line => ({
            ledgerAccountId: line.ledgerAccountId,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: {
        lines: {
          include: {
            ledgerAccount: true,
          },
        },
      },
    })
  },

  async findAll({
    branchId,
    tenantId,
    page = 1,
    limit = 10,
    startDate,
    endDate
  }: {
    branchId?: string,
    tenantId?: string,
    page?: number,
    limit?: number,
    startDate?: Date,
    endDate?: Date
  } = {}) {
    const where = {
      ...(branchId ? { branchId } : {}),
      ...(tenantId ? { tenantId } : {}),
      ...(startDate || endDate ? {
        date: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {})
        }
      } : {})
    };

    const [total, data] = await Promise.all([
      prisma.journalEntry.count({ where }),
      prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              ledgerAccount: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      })
    ]);

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async findById(id: string) {
    return await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            ledgerAccount: true,
          },
        },
      },
    })
  },

  async delete(id: string) {
    return await prisma.journalEntry.delete({
      where: { id },
    })
  },

  async findByAccountId(accountId: string, branchId?: string, tenantId?: string) {
    // Finds all journal entries that contain a line for this account
    return await prisma.journalEntry.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(tenantId ? { tenantId } : {}),
        lines: {
          some: {
            ledgerAccountId: accountId
          }
        }
      },
      include: {
        lines: {
          include: {
            ledgerAccount: true
          }
        }
      },
      orderBy: { date: "desc" }
    });
  },

  async findExpenseEntries({
    branchId,
    tenantId,
    page = 1,
    limit = 10,
    startDate,
    endDate
  }: {
    branchId?: string,
    tenantId?: string,
    page?: number,
    limit?: number,
    startDate?: Date,
    endDate?: Date
  } = {}) {
    // Finds all journal entries that contain a line mapped to an EXPENSE account
    const where = {
      ...(branchId ? { branchId } : {}),
      ...(tenantId ? { tenantId } : {}),
      ...(startDate || endDate ? {
        date: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {})
        }
      } : {}),
      lines: {
        some: {
          ledgerAccount: {
            type: 'EXPENSE' as const
          }
        }
      }
    };

    const [total, data] = await Promise.all([
      prisma.journalEntry.count({ where }),
      prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              ledgerAccount: true
            }
          }
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      })
    ]);

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
