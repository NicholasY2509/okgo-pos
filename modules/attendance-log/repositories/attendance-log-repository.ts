import { Prisma } from "@/lib/generated/prisma"
import { prisma } from "@/lib/prisma"

export interface GetLogsParams {
  page: number
  limit: number
  search?: string
  branchId?: string
  state?: number
}

export const AttendanceLogRepository = {
  async getLogs({ page, limit, search, branchId, state }: GetLogsParams) {
    const skip = (page - 1) * limit

    const where: Prisma.AttendanceMachineLogWhereInput = {}

    if (search) {
      where.OR = [
        { cardName: { contains: search } },
        { deviceSn: { contains: search } },
        {
          staff: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } }
            ]
          }
        }
      ]
    }

    if (branchId) {
      where.branchId = branchId
    }

    if (state !== undefined) {
      where.attendanceState = state
    }

    const [logs, total] = await Promise.all([
      prisma.attendanceMachineLog.findMany({
        where,
        include: {
          branch: true,
          staff: true
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      prisma.attendanceMachineLog.count({ where })
    ])

    return {
      logs,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
