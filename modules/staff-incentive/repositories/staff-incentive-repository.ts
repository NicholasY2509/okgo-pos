import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

export interface GetIncentivesFilter {
  search?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export const StaffIncentiveRepository = {
  async getIncentives(filter: GetIncentivesFilter) {
    const { search, type, startDate, endDate, page = 1, limit = 10 } = filter;

    const where: Prisma.StaffIncentiveWhereInput = {};

    if (search) {
      where.OR = [
        { staff: { firstName: { contains: search } } },
        { staff: { lastName: { contains: search } } },
        { description: { contains: search } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.date = { gte: startDate };
    } else if (endDate) {
      where.date = { lte: endDate };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.staffIncentive.findMany({
        where,
        include: {
          staff: true,
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.staffIncentive.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        totalPages,
        page,
        limit,
      },
    };
  },

  async getIncentiveSummary(filter: Omit<GetIncentivesFilter, "page" | "limit">) {
    const { type, startDate, endDate } = filter;

    let totalIncentive = 0;
    let totalGross = 0;
    let totalCount = 0;
    const branchBreakdowns: { branchName: string, gross: number, incentive: number }[] = [];

    // 1. TERAPIS (SERVICE_COMMISSION) - Static via StaffIncentive table
    if (!type || type === "ALL" || type === "SERVICE_COMMISSION") {
      const where: Prisma.StaffIncentiveWhereInput = { type: "SERVICE_COMMISSION" };
      if (startDate && endDate) where.date = { gte: startDate, lte: endDate };
      else if (startDate) where.date = { gte: startDate };
      else if (endDate) where.date = { lte: endDate };

      const agg = await prisma.staffIncentive.aggregate({
        where,
        _sum: { amount: true, gross: true },
        _count: { id: true }
      });

      totalIncentive += Number(agg._sum.amount || 0);
      totalGross += Number(agg._sum.gross || 0);
      totalCount += agg._count.id || 0;
    }

    // 2. KASIR (CASHIER_COMMISSION) - Dynamic calculation per cashier
    if (!type || type === "ALL" || type === "CASHIER_COMMISSION") {
      const kasirRule = await prisma.incentiveRule.findFirst({
        where: { ruleType: "VOUCHER_SALES_TIERED", isActive: true },
        include: { tiers: { orderBy: { minTarget: "desc" } } }
      });

      const transactions = await prisma.transaction.findMany({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          items: {
            some: { type: "VOUCHER_PACKET" }
          }
        },
        include: {
          items: {
            where: { type: "VOUCHER_PACKET" }
          }
        }
      });

      const cashierSales = new Map<string, { count: number, gross: number }>();
      for (const t of transactions) {
        if (!t.cashierId) continue;
        if (!cashierSales.has(t.cashierId)) cashierSales.set(t.cashierId, { count: 0, gross: 0 });
        const sales = cashierSales.get(t.cashierId)!;

        for (const item of t.items) {
          sales.count += item.quantity;
          sales.gross += Number(item.subtotal);
        }
      }

      for (const sales of cashierSales.values()) {
        totalGross += sales.gross;
        totalCount += sales.count;

        if (kasirRule) {
          // Assuming tiers are based on quantity of vouchers sold
          const matchedTier = kasirRule.tiers.find(t => sales.count >= Number(t.minTarget));
          if (matchedTier) {
            totalIncentive += Number(matchedTier.amount || 0);
          }
        }
      }
    }

    // 3. SPV (MANUAL_BONUS / TOTAL_SALES_TIERED) - Dynamic calculation per branch
    if (!type || type === "ALL" || type === "MANUAL_BONUS") {
      const spvRule = await prisma.incentiveRule.findFirst({
        where: { ruleType: "TOTAL_SALES_TIERED", isActive: true },
        include: { tiers: { orderBy: { minTarget: "desc" } } }
      });

      const spvAgg = await prisma.transaction.groupBy({
        by: ['branchId'],
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { totalAmount: true }
      });

      const branches = await prisma.branch.findMany({
        where: { id: { in: spvAgg.map(a => a.branchId) } },
        select: { id: true, name: true }
      });

      let spvGrossTotal = 0;

      for (const branchAgg of spvAgg) {
        const branchGross = Number(branchAgg._sum.totalAmount || 0);
        spvGrossTotal += branchGross;

        let branchIncentive = 0;
        if (spvRule) {
          const matchedTier = spvRule.tiers.find(t => branchGross >= Number(t.minTarget));
          if (matchedTier) {
            branchIncentive = Number(matchedTier.amount || 0);
          }
        }

        totalIncentive += branchIncentive;

        branchBreakdowns.push({
          branchName: branches.find(b => b.id === branchAgg.branchId)?.name || "Cabang Tidak Diketahui",
          gross: branchGross,
          incentive: branchIncentive
        });
      }

      if (type === "MANUAL_BONUS") {
        totalGross = spvGrossTotal;
      }
    }

    return {
      totalIncentive,
      totalGross,
      totalCount,
      branchBreakdowns,
    };
  }
};
