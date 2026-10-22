import { prisma } from "@/lib/prisma"
import { AttendanceMachineInput } from "../schemas/attendance-machine"

export const AttendanceMachineRepository = {
  async create(data: AttendanceMachineInput) {
    const { branchId, ...rest } = data
    return await prisma.attendanceMachine.create({
      data: {
        ...rest,
        branch: { connect: { id: branchId } }
      }
    })
  },
  async update(id: string, data: AttendanceMachineInput) {
    const { branchId, ...rest } = data
    return await prisma.attendanceMachine.update({
      where: { id },
      data: {
        ...rest,
        ...(branchId ? { branch: { connect: { id: branchId } } } : {})
      }
    })
  },
  async delete(id: string) {
    return await prisma.attendanceMachine.delete({ where: { id } })
  },
  async findById(id: string) {
    return await prisma.attendanceMachine.findUnique({ where: { id } })
  },
  async findBySn(sn: string) {
    return await prisma.attendanceMachine.findUnique({ where: { sn } })
  },
  async findAll() {
    return await prisma.attendanceMachine.findMany({
      include: {
        branch: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  }
}
