import { prisma } from "@/lib/prisma"

export const ReportRepository = {
  async getAccountBalances(options: {
    startDate?: Date
    endDate?: Date
    asOfDate?: Date
    branchId?: string
    tenantId?: string
    accountTypes?: string[]
  }) {
    // Determine the date filter.
    // If asOfDate is provided, we want all entries up to that date (for Balance Sheet).
    // If startDate/endDate is provided, we want entries within that range (for P&L and Trial Balance).
    let dateFilter: any = {};
    if (options.asOfDate) {
      dateFilter.lte = options.asOfDate;
    } else if (options.startDate || options.endDate) {
      if (options.startDate) dateFilter.gte = options.startDate;
      if (options.endDate) dateFilter.lte = options.endDate;
    }

    const whereClause: any = {
      journalEntry: {
        ...(options.branchId ? { branchId: options.branchId } : {}),
        ...(options.tenantId ? { tenantId: options.tenantId } : {}),
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
      }
    };

    if (options.accountTypes && options.accountTypes.length > 0) {
      whereClause.ledgerAccount = {
        type: { in: options.accountTypes }
      };
    }

    // Using Prisma groupBy to sum debits and credits per ledgerAccountId
    const grouped = await prisma.journalLine.groupBy({
      by: ['ledgerAccountId'],
      where: whereClause,
      _sum: {
        debit: true,
        credit: true,
      }
    });

    // Also fetch the account details to enrich the response
    const accountIds = grouped.map(g => g.ledgerAccountId);
    const accounts = await prisma.ledgerAccount.findMany({
      where: { id: { in: accountIds } }
    });

    return grouped.map(g => {
      const account = accounts.find(a => a.id === g.ledgerAccountId)!;
      return {
        account,
        totalDebit: Number(g._sum.debit || 0),
        totalCredit: Number(g._sum.credit || 0)
      };
    });
  },

  async getDailySummary(date: Date, branchId?: string, tenantId?: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause = {
      ...(branchId ? { branchId } : {}),
      ...(tenantId ? { tenantId } : {}),
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: "COMPLETED" as const
    };

    // Total Transactions & POS Revenue
    const posTransactions = await prisma.transaction.aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true
      }
    });

    // Get expenses from journals for that day
    const expenses = await prisma.journalLine.aggregate({
      where: {
        journalEntry: {
          ...(branchId ? { branchId } : {}),
          ...(tenantId ? { tenantId } : {}),
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        ledgerAccount: {
          type: "EXPENSE"
        }
      },
      _sum: {
        debit: true, // Expenses normally have debit balance
      }
    });

    return {
      posRevenue: Number(posTransactions._sum.totalAmount || 0),
      transactionCount: posTransactions._count.id,
      expenses: Number(expenses._sum.debit || 0)
    };
  },

  async getAllAccounts(branchId?: string, tenantId?: string) {
    // For Trial Balance we often need ALL accounts, even those with zero balance
    return await prisma.ledgerAccount.findMany({
      where: {
        // COA could be global or branch specific depending on how it's seeded. Currently it seems global per tenant/system.
        ...(tenantId ? { tenantId } : {})
      },
      orderBy: { code: 'asc' }
    });
  }
}
