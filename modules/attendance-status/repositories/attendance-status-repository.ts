import { prisma } from "@/lib/prisma"
import { AttendanceStatusInput } from "../schemas/attendance-status"

export const AttendanceStatusRepository = {
  async create(data: AttendanceStatusInput) {
    return await prisma.attendanceStatus.create({ data })
  },
  async update(id: string, data: AttendanceStatusInput) {
    return await prisma.attendanceStatus.update({ where: { id }, data })
  },
  async delete(id: string) {
    return await prisma.attendanceStatus.delete({ where: { id } })
  },
  async findById(id: string) {
    return await prisma.attendanceStatus.findUnique({ where: { id } })
  },
  async findByCode(code: string) {
    return await prisma.attendanceStatus.findUnique({ where: { code } })
  },
  async findAll() {
    return await prisma.attendanceStatus.findMany({
      orderBy: { name: 'asc' }
    })
  }
}
