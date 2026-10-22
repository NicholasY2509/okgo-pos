import { Prisma } from "@/lib/generated/prisma"
import { prisma } from "@/lib/prisma"

export const AttendanceSyncRepository = {
  async findMachineBySn(sn: string) {
    return await prisma.attendanceMachine.findUnique({
      where: { sn }
    })
  },

  async findStaffMachine(machineId: string, machineUserId: string) {
    return await prisma.staffMachine.findUnique({
      where: {
        machineId_machineUserId: {
          machineId,
          machineUserId
        }
      }
    })
  },

  async findExistingLog(deviceSn: string, utcTime: Date) {
    return await prisma.attendanceMachineLog.findFirst({
      where: {
        deviceSn,
        utcTime
      }
    })
  },

  async createLog(data: Prisma.AttendanceMachineLogUncheckedCreateInput) {
    return await prisma.attendanceMachineLog.create({
      data
    })
  },

  async purgeUnrecognizedLogs(branchId?: string) {
    const where: Prisma.AttendanceMachineLogWhereInput = {
      OR: [
        { machineUserId: null },
        { machineUserId: "" },
        { cardName: "Tidak Dikenal" }
      ]
    }

    if (branchId) {
      where.branchId = branchId
    }

    return await prisma.attendanceMachineLog.deleteMany({
      where
    })
  }
}
