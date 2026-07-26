import { prisma } from "@/lib/prisma"
import { AttendanceMachineInput } from "../schemas/attendance-machine"

export const AttendanceMachineRepository = {
  async create(data: AttendanceMachineInput) {
    return await prisma.attendanceMachine.create({ data })
  },
  async update(id: string, data: AttendanceMachineInput) {
    return await prisma.attendanceMachine.update({ where: { id }, data })
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
