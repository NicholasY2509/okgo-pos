import { prisma } from "@/lib/prisma"
import { CreateStaffInput, UpdateStaffInput } from "../schemas/staff-schema"
import { StaffAvailabilityService } from "../services/staff-availability-service"
import { addMinutes } from "date-fns"

export const StaffRepository = {
  async getAllStaff(branchId?: string, serviceId?: string, excludeSessionId?: string, startTime?: Date) {
    const todayStr = (startTime || new Date()).toISOString().split('T')[0];
    const todayStart = new Date(todayStr + "T00:00:00.000Z");
    const todayEnd = new Date(todayStr + "T23:59:59.999Z");

    let workPositionId: string | undefined = undefined;
    let maxDuration = 60;
    if (serviceId) {
      const product = await prisma.product.findUnique({
        where: { id: serviceId },
        include: { category: true }
      });
      if (product?.category?.targetWorkPositionId) {
        workPositionId = product.category.targetWorkPositionId;
      }
      if (product?.duration) {
        maxDuration = product.duration;
      }
    }

    const whereClause: any = {
      isActive: true,
    };
    if (branchId) {
      whereClause.branchStaffs = { some: { branchId } };
    }
    if (workPositionId) {
      whereClause.workPositionId = workPositionId;
    }

    const staffList = await prisma.staff.findMany({
      where: whereClause,
      include: {
        workPosition: true,
        branchStaffs: { include: { branch: true } },
        staffUsers: { include: { user: true } },
        attendances: {
          where: {
            attendanceDate: {
              gte: todayStart,
              lte: todayEnd,
            }
          }
        }
      },
    });

    // Sort by attendance clockIn (earliest first), then nulls at the bottom
    staffList.sort((a: any, b: any) => {
      const aTime = a.attendances?.[0]?.clockIn ? new Date(a.attendances[0].clockIn).getTime() : Infinity;
      const bTime = b.attendances?.[0]?.clockIn ? new Date(b.attendances[0].clockIn).getTime() : Infinity;
      return aTime - bTime;
    });

    const now = startTime || new Date();
    const endTime = addMinutes(now, maxDuration);

    const sessionWhereClause: any = {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      startTime: { lte: endTime },
    };
    if (branchId) {
      sessionWhereClause.branchId = branchId;
    }
    if (excludeSessionId) {
      sessionWhereClause.id = { not: excludeSessionId };
    }

    const existingSessions = await prisma.serviceSession.findMany({
      where: sessionWhereClause,
    });

    const busyStaffIds = StaffAvailabilityService.getBusyStaffIds(existingSessions, now, endTime);

    return staffList.filter((s: any) => !busyStaffIds.has(s.id));
  },

  async getActiveStaff(branchId: string) {
    return await prisma.staff.findMany({
      where: { branchStaffs: { some: { branchId } }, isActive: true },
      orderBy: { firstName: "asc" },
    })
  },

  async getStaffById(id: string) {
    return await prisma.staff.findUnique({
      where: { id },
      include: {
        workPosition: true,
        branchStaffs: {
          include: {
            branch: true,
            role: true
          }
        },
        staffUsers: {
          include: {
            user: true,
          }
        }
      },
    })
  },

  async createStaff(data: CreateStaffInput) {
    return await prisma.staff.create({
      data,
    })
  },

  async updateStaff(id: string, data: Omit<UpdateStaffInput, "id">) {
    return await prisma.staff.update({
      where: { id },
      data,
    })
  },

  async deleteStaff(id: string) {
    return await prisma.staff.delete({
      where: { id },
    })
  },

  async findManyWithFilter(where: any, skip: number, limit: number) {
    return await prisma.staff.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        workPosition: true,
        branchStaffs: {
          include: {
            branch: true,
          }
        },
        staffUsers: {
          include: {
            user: true,
          }
        }
      },
    })
  },

  async count(where: any) {
    return await prisma.staff.count({ where })
  },

  async getLastStaffIdNumber() {
    return await prisma.staff.findFirst({
      where: {
        staffIdNumber: {
          not: null,
          startsWith: "STF-"
        }
      },
      orderBy: { staffIdNumber: "desc" },
      select: { staffIdNumber: true }
    })
  }
}
