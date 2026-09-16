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

export interface GetIncentiveDetailsFilter {
  staffId: string;
  type: string;
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
    const branchBreakdowns: { branchName: string, gross: number, incentive: number, tierName?: string }[] = [];
    const staffBreakdowns: { staffId: string, staffName: string, gross: number, incentive: number, count: number, tierName?: string, type: "SERVICE_COMMISSION" | "CASHIER_COMMISSION" }[] = [];

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

      if (type === "SERVICE_COMMISSION") {
        const staffAgg = await prisma.staffIncentive.groupBy({
          by: ['staffId'],
          where,
          _sum: { amount: true, gross: true },
          _count: { id: true }
        });

        if (staffAgg.length > 0) {
          const staffs = await prisma.staff.findMany({
            where: { id: { in: staffAgg.map(s => s.staffId) } },
            select: { id: true, firstName: true, lastName: true }
          });

          for (const s of staffAgg) {
            const staffInfo = staffs.find(st => st.id === s.staffId);
            staffBreakdowns.push({
              staffId: s.staffId,
              staffName: staffInfo ? `${staffInfo.firstName} ${staffInfo.lastName}`.trim() : "Staf Tidak Diketahui",
              gross: Number(s._sum.gross || 0),
              incentive: Number(s._sum.amount || 0),
              count: s._count.id || 0,
              type: "SERVICE_COMMISSION"
            });
          }

          staffBreakdowns.sort((a, b) => b.incentive - a.incentive);
        }
      }
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

      const cashierIds = Array.from(cashierSales.keys());
      const cashiers = await prisma.staff.findMany({
        where: { id: { in: cashierIds } },
        select: { id: true, firstName: true, lastName: true }
      });

      for (const [cashierId, sales] of cashierSales.entries()) {
        totalGross += sales.gross;
        totalCount += sales.count;

        let cashierIncentive = 0;
        let tierName: string | undefined;
        if (kasirRule) {
          // Assuming tiers are based on quantity of vouchers sold
          const matchedTierIndex = kasirRule.tiers.findIndex(t => sales.count >= Number(t.minTarget));
          if (matchedTierIndex !== -1) {
            const matchedTier = kasirRule.tiers[matchedTierIndex];
            const tierRank = kasirRule.tiers.length - matchedTierIndex;
            const romanNumerals = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
            const roman = romanNumerals[tierRank] || tierRank.toString();
            tierName = `Tier ${roman}`;

            if (matchedTier.percentage) {
              cashierIncentive = sales.gross * (Number(matchedTier.percentage) / 100);
            } else {
              cashierIncentive = Number(matchedTier.amount || 0);
            }
          } else {
            tierName = "Belum mencapai target";
          }
        }
        totalIncentive += cashierIncentive;

        const cashierInfo = cashiers.find(c => c.id === cashierId);
        staffBreakdowns.push({
          staffId: cashierId,
          staffName: cashierInfo ? `${cashierInfo.firstName} ${cashierInfo.lastName}`.trim() : "Kasir Tidak Diketahui",
          gross: sales.gross,
          incentive: cashierIncentive,
          count: sales.count,
          tierName,
          type: "CASHIER_COMMISSION"
        });
      }

      if (type === "CASHIER_COMMISSION") {
        staffBreakdowns.sort((a, b) => b.incentive - a.incentive);
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
        let tierName: string | undefined;
        if (spvRule) {
          const matchedTierIndex = spvRule.tiers.findIndex(t => branchGross >= Number(t.minTarget));
          if (matchedTierIndex !== -1) {
            const matchedTier = spvRule.tiers[matchedTierIndex];
            const tierRank = spvRule.tiers.length - matchedTierIndex;
            const romanNumerals = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
            const roman = romanNumerals[tierRank] || tierRank.toString();
            tierName = `Tier ${roman}`;

            if (matchedTier.percentage) {
              branchIncentive = branchGross * (Number(matchedTier.percentage) / 100);
            } else {
              branchIncentive = Number(matchedTier.amount || 0);
            }
          } else {
            tierName = "Belum mencapai target";
          }
        }

        totalIncentive += branchIncentive;

        branchBreakdowns.push({
          branchName: branches.find(b => b.id === branchAgg.branchId)?.name || "Cabang Tidak Diketahui",
          gross: branchGross,
          incentive: branchIncentive,
          tierName
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
      staffBreakdowns,
    };
  },

  async getStaffIncentiveDetails(filter: GetIncentiveDetailsFilter) {
    const { staffId, type, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    let parsedStartDate = filter.startDate ? new Date(filter.startDate) : undefined;
    let parsedEndDate = filter.endDate ? new Date(filter.endDate) : undefined;
    if (parsedEndDate) {
      parsedEndDate.setHours(23, 59, 59, 999);
    }

    if (type === "SERVICE_COMMISSION") {
      const where: Prisma.StaffIncentiveWhereInput = { staffId, type };
      if (parsedStartDate && parsedEndDate) where.date = { gte: parsedStartDate, lte: parsedEndDate };
      else if (parsedStartDate) where.date = { gte: parsedStartDate };
      else if (parsedEndDate) where.date = { lte: parsedEndDate };

      const [data, total] = await Promise.all([
        prisma.staffIncentive.findMany({
          where,
          include: {
            transactionItem: true,
            serviceSession: {
              include: { transactionItem: true }
            }
          },
          orderBy: { date: "desc" },
          skip,
          take: limit,
        }),
        prisma.staffIncentive.count({ where }),
      ]);

      const formattedData = data.map(d => ({
        id: d.id,
        date: d.date,
        itemName: d.transactionItem?.itemNameSnapshot || d.serviceSession?.transactionItem?.itemNameSnapshot || d.description || "Layanan",
        quantity: d.transactionItem?.quantity || d.serviceSession?.transactionItem?.quantity || 1,
        gross: Number(d.gross || 0),
        incentive: Number(d.amount || 0)
      }));

      return {
        data: formattedData,
        pagination: { total, totalPages: Math.ceil(total / limit), page, limit },
      };
    } else if (type === "CASHIER_COMMISSION") {
      const where: Prisma.TransactionItemWhereInput = {
        type: "VOUCHER_PACKET",
        transaction: {
          status: "COMPLETED",
          cashierId: staffId,
        }
      };

      if (parsedStartDate && parsedEndDate) {
        where.transaction!.createdAt = { gte: parsedStartDate, lte: parsedEndDate };
      } else if (parsedStartDate) {
        where.transaction!.createdAt = { gte: parsedStartDate };
      } else if (parsedEndDate) {
        where.transaction!.createdAt = { lte: parsedEndDate };
      }

      const [data, total] = await Promise.all([
        prisma.transactionItem.findMany({
          where,
          include: { transaction: true },
          orderBy: { transaction: { createdAt: "desc" } },
          skip,
          take: limit,
        }),
        prisma.transactionItem.count({ where }),
      ]);

      const formattedData = data.map(d => ({
        id: d.id,
        date: d.transaction.createdAt,
        itemName: d.itemNameSnapshot,
        quantity: d.quantity,
        gross: Number(d.subtotal || 0),
        incentive: 0 // Cashier incentive is tiered, we can't show it per item easily. We can show 0 or null.
      }));

      return {
        data: formattedData,
        pagination: { total, totalPages: Math.ceil(total / limit), page, limit },
      };
    }

    return { data: [], pagination: { total: 0, totalPages: 0, page, limit } };
  }
};
