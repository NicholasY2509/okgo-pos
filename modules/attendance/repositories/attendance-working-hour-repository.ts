import { prisma } from "@/lib/prisma";
import type { AttendanceWorkingHourInput } from "../schemas/attendance-working-hour";

export const AttendanceWorkingHourRepository = {
  async findManyByStaffId(staffId: string, startDate?: Date, endDate?: Date) {
    const where: any = { staffId };
    
    if (startDate && endDate) {
      where.attendanceDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    return prisma.attendanceWorkingHour.findMany({
      where,
      include: {
        workingHour: true,
      },
      orderBy: { attendanceDate: "asc" },
    });
  },

  async create(data: AttendanceWorkingHourInput) {
    return prisma.attendanceWorkingHour.create({ data });
  },

  async upsert(data: AttendanceWorkingHourInput) {
    return prisma.attendanceWorkingHour.upsert({
      where: {
        staffId_attendanceDate: {
          staffId: data.staffId,
          attendanceDate: data.attendanceDate,
        },
      },
      update: {
        workingHourId: data.workingHourId,
      },
      create: data,
    });
  },

  async delete(id: string) {
    return prisma.attendanceWorkingHour.delete({
      where: { id },
    });
  },

  async findManyPaginated(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.staff = {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      prisma.attendanceWorkingHour.findMany({
        where,
        skip,
        take: limit,
        orderBy: { attendanceDate: "desc" },
        include: {
          staff: true,
          workingHour: true,
        },
      }),
      prisma.attendanceWorkingHour.count({ where }),
    ]);

    return { data, total };
  },

  async findOverlapping(minDate: Date, maxDate: Date, staffIds: string[]) {
    return prisma.attendanceWorkingHour.findFirst({
      where: {
        attendanceDate: {
          gte: minDate,
          lte: maxDate,
        },
        staffId: { in: staffIds },
      },
    });
  },

  async replaceSchedules(
    dateStaffEntries: [string, string[]][],
    records: { staffId: string; attendanceDate: Date; workingHourId: string }[]
  ) {
    return prisma.$transaction(async (tx) => {
      for (const [dateStr, staffIds] of dateStaffEntries) {
        await tx.attendanceWorkingHour.deleteMany({
          where: {
            attendanceDate: new Date(dateStr),
            staffId: { in: staffIds },
          },
        });
      }

      return tx.attendanceWorkingHour.createMany({
        data: records,
      });
    });
  },
};

