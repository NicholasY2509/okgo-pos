import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

export interface GetIncentivesFilter {
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export const StaffIncentiveRepository = {
  async getIncentives(filter: GetIncentivesFilter) {
    const { search, startDate, endDate, page = 1, limit = 10 } = filter;

    const where: Prisma.StaffIncentiveWhereInput = {};

    if (search) {
      where.OR = [
        { staff: { firstName: { contains: search } } },
        { staff: { lastName: { contains: search } } },
        { description: { contains: search } }
      ];
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
};
