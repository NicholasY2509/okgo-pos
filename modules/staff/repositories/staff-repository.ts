import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma"
import { CreateStaffInput, UpdateStaffInput } from "../schemas/staff-schema"
import { StaffAvailabilityService } from "../services/staff-availability-service"
import { addMinutes } from "date-fns"
import { BranchStaffHrisItem } from "../types/hris-types"

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
            role: true,
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
  },

  async getActiveStaffIds() {
    return await prisma.staff.findMany({
      where: { isActive: true },
      select: { id: true }
    })
  },

  async getActiveStaffForExport() {
    return await prisma.staff.findMany({
      where: { isActive: true },
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        staffIdNumber: true
      }
    })
  },

  async findStaffIds(where: Prisma.StaffWhereInput) {
    const staff = await prisma.staff.findMany({
      where,
      select: { id: true },
    })
    return staff.map((s) => s.id)
  },

  async getBranchHrisRoster(branchId: string): Promise<BranchStaffHrisItem[]> {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // 1. Fetch staff for this branch
    const staff = await prisma.staff.findMany({
      where: {
        branchStaffs: { some: { branchId } },
        isActive: true,
      },
      include: {
        workPosition: true,
        branchStaffs: {
          where: { branchId },
          include: { role: true },
        },
      },
      orderBy: [
        { workPosition: { name: "asc" } },
        { firstName: "asc" },
      ],
    })

    const staffIds = staff.map((s) => s.id)

    // 2. Fetch rooms in branch
    const rooms = await prisma.room.findMany({
      where: { branchId },
      select: { id: true, name: true },
    })
    const roomMap = new Map(rooms.map((r) => [r.id, r.name]))

    // 3. Fetch products/services
    const services = await prisma.product.findMany({
      select: { id: true, name: true },
    })
    const serviceMap = new Map(services.map((s) => [s.id, s.name]))

    // 4. Fetch today's sessions for this branch
    const sessions = await prisma.serviceSession.findMany({
      where: {
        branchId,
        status: { in: ["IN_PROGRESS", "SCHEDULED"] },
        startTime: { lte: endOfToday },
      },
      include: {
        booking: {
          select: {
            customerName: true,
            customer: { select: { name: true } },
          },
        },
        transactionItem: {
          select: {
            itemNameSnapshot: true,
            transaction: {
              select: {
                customer: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    })

    // 5. Fetch today's attendances
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        staffId: { in: staffIds },
        attendanceDate: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        status: true,
        attendanceWorkingHour: {
          include: { workingHour: true },
        },
      },
    })

    // 6. Fetch monthly attendances for recap
    const monthAttendances = await prisma.attendance.findMany({
      where: {
        staffId: { in: staffIds },
        attendanceDate: { gte: startOfMonth, lte: endOfToday },
      },
      include: {
        status: true,
      },
    })

    return staff.map((s) => {
      // Find current active session
      const currentSession = sessions.find(
        (sess) =>
          sess.staffId === s.id &&
          (sess.status === "IN_PROGRESS" ||
            (sess.status === "SCHEDULED" &&
              sess.startTime &&
              sess.endTime &&
              sess.startTime <= now &&
              sess.endTime >= now))
      )

      let activity: BranchStaffHrisItem["activity"]
      if (currentSession) {
        activity = {
          isBusy: true,
          status: "BUSY",
          currentSession: {
            serviceName:
              currentSession.transactionItem?.itemNameSnapshot ||
              serviceMap.get(currentSession.serviceId) ||
              "Treatment",
            roomName: roomMap.get(currentSession.roomId) || "Room",
            customerName:
              currentSession.booking?.customerName ||
              currentSession.booking?.customer?.name ||
              currentSession.transactionItem?.transaction?.customer?.name ||
              "Tamu",
            startTime:
              currentSession.actualStartTime?.toISOString() ||
              currentSession.startTime?.toISOString(),
            endTime: currentSession.endTime?.toISOString(),
          },
        }
      } else {
        const nextSession = sessions.find(
          (sess) =>
            sess.staffId === s.id &&
            sess.status === "SCHEDULED" &&
            sess.startTime &&
            sess.startTime > now
        )

        activity = {
          isBusy: false,
          status: "AVAILABLE",
          nextSession:
            nextSession && nextSession.startTime
              ? {
                  serviceName:
                    nextSession.transactionItem?.itemNameSnapshot ||
                    serviceMap.get(nextSession.serviceId) ||
                    "Treatment",
                  roomName: roomMap.get(nextSession.roomId) || "Room",
                  startTime: nextSession.startTime.toISOString(),
                }
              : undefined,
        }
      }

      // Today's attendance
      const todayAtt = todayAttendances.find((a) => a.staffId === s.id)
      const todayAttendance: BranchStaffHrisItem["todayAttendance"] = {
        status:
          todayAtt?.status?.name ||
          (todayAtt?.clockIn ? "Hadir" : "Belum Absen"),
        statusCode:
          todayAtt?.status?.code ||
          (todayAtt?.clockIn ? "H" : "UNRECORDED"),
        clockIn: todayAtt?.clockIn?.toISOString(),
        clockOut: todayAtt?.clockOut?.toISOString(),
        shiftName: todayAtt?.attendanceWorkingHour?.workingHour?.name,
        shiftHours: todayAtt?.attendanceWorkingHour?.workingHour
          ? `${todayAtt.attendanceWorkingHour.workingHour.clockIn} - ${todayAtt.attendanceWorkingHour.workingHour.clockOut}`
          : undefined,
      }

      // Monthly recap
      const staffMonthAtts = monthAttendances.filter((a) => a.staffId === s.id)
      const present = staffMonthAtts.filter(
        (a) =>
          a.status?.code === "H" ||
          a.status?.code === "PRESENT" ||
          a.status?.name?.toLowerCase() === "hadir"
      ).length
      const late = staffMonthAtts.filter(
        (a) =>
          a.status?.code === "T" ||
          a.status?.code === "LATE" ||
          a.status?.name?.toLowerCase() === "terlambat"
      ).length
      const leave = staffMonthAtts.filter(
        (a) =>
          ["I", "C", "S", "LEAVE", "SICK", "PERMIT"].includes(a.status?.code || "") ||
          ["izin", "cuti", "sakit"].includes(a.status?.name?.toLowerCase() || "")
      ).length
      const absent = staffMonthAtts.filter(
        (a) =>
          a.status?.code === "A" ||
          a.status?.code === "ABSENT" ||
          a.status?.name?.toLowerCase() === "absen" ||
          a.status?.name?.toLowerCase() === "mangkir"
      ).length
      const totalDays = staffMonthAtts.length
      const rate =
        totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 100

      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`.trim(),
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        email: s.email,
        staffIdNumber: s.staffIdNumber,
        imageUrl: s.imageUrl,
        position: s.workPosition?.name || "Karyawan",
        role: s.branchStaffs[0]?.role?.name || "Staf",
        activity,
        todayAttendance,
        attendanceRecap: {
          present,
          late,
          leave,
          absent,
          totalDays,
          rate,
        },
      }
    })
  },
}

