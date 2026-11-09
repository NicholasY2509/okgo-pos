import { prisma } from "@/lib/prisma"

export interface CreateLogData {
  machineUserId: string
  cardName: string
  attendanceState: number
  punchType: string
  deviceSn: string
  branchId?: string | null
  staffId?: string | null
  utcTime: Date
  rawPayload?: string
}

export const FingerspotRepository = {
  async getActiveMachines() {
    return await prisma.attendanceMachine.findMany({
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  },

  async findMachineBySn(sn: string) {
    return await prisma.attendanceMachine.findUnique({
      where: { sn },
      include: {
        branch: true,
      },
    })
  },

  async findStaffMachine(machineId: string, machineUserId: string) {
    return await prisma.staffMachine.findUnique({
      where: {
        machineId_machineUserId: {
          machineId,
          machineUserId,
        },
      },
      include: {
        staff: true,
      },
    })
  },

  async getRecentLogs(limit = 20, deviceSn?: string) {
    return await prisma.attendanceMachineLog.findMany({
      where: deviceSn ? { deviceSn } : undefined,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })
  },

  async checkExistingLog(deviceSn: string, machineUserId: string, utcTime: Date) {
    return await prisma.attendanceMachineLog.findFirst({
      where: {
        deviceSn,
        machineUserId,
        utcTime,
      },
    })
  },

  async createLog(data: CreateLogData) {
    return await prisma.attendanceMachineLog.create({
      data: {
        machineUserId: data.machineUserId,
        cardName: data.cardName,
        attendanceState: data.attendanceState,
        punchType: data.punchType,
        deviceSn: data.deviceSn,
        branchId: data.branchId || null,
        staffId: data.staffId || null,
        utcTime: data.utcTime,
        rawPayload: data.rawPayload,
      },
    })
  },
}

