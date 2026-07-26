import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { AttendanceInput } from "../schemas/attendance"

export interface GetAttendancesParams {
  page?: number
  limit?: number
  search?: string
  startDate?: Date
  endDate?: Date
  statusId?: string
}

export const AttendanceRepository = {
  async create(data: AttendanceInput) {
    return await prisma.attendance.create({ data })
  },
  
  async update(id: string, data: Partial<AttendanceInput>) {
    return await prisma.attendance.update({ where: { id }, data })
  },
  
  async delete(id: string) {
    return await prisma.attendance.delete({ where: { id } })
  },
  
  async findByStaffAndDate(staffId: string, attendanceDate: Date) {
    // Normalisasi date ke awal hari UTC agar konsisten pencariannya
    const startOfDay = new Date(attendanceDate)
    startOfDay.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setUTCDate(startOfDay.getUTCDate() + 1)

    return await prisma.attendance.findFirst({
      where: {
        staffId,
        attendanceDate: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })
  },

  async getAttendances({ page = 1, limit = 10, search, startDate, endDate, statusId }: GetAttendancesParams) {
    const skip = (page - 1) * limit
    const where: Prisma.AttendanceWhereInput = {}

    if (search) {
      where.staff = {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } }
        ]
      }
    }

    if (startDate && endDate) {
      where.attendanceDate = {
        gte: startDate,
        lte: endDate
      }
    } else if (startDate) {
      where.attendanceDate = { gte: startDate }
    } else if (endDate) {
      where.attendanceDate = { lte: endDate }
    }

    if (statusId) {
      where.statusId = statusId
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          staff: true,
          status: true,
          attendanceWorkingHour: {
            include: { workingHour: true }
          },
          clockInMachine: true,
          clockOutMachine: true,
        },
        orderBy: {
          attendanceDate: "desc"
        },
        skip,
        take: limit
      }),
      prisma.attendance.count({ where })
    ])

    return {
      attendances,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
