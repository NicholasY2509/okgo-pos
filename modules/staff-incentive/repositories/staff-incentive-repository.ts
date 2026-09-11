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
    const { search, type, startDate, endDate } = filter;

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

    const aggregations = await prisma.staffIncentive.aggregate({
      where,
      _sum: {
        amount: true,
        gross: true,
      },
      _count: {
        id: true,
      }
    });

    return {
      totalIncentive: aggregations._sum.amount ? Number(aggregations._sum.amount) : 0,
      totalGross: aggregations._sum.gross ? Number(aggregations._sum.gross) : 0,
      totalCount: aggregations._count.id || 0,
    };
  }
};
