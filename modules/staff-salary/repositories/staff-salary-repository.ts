import { prisma } from "@/lib/prisma"

export const StaffSalaryRepository = {
  async create(data: any) {
    return await prisma.staffSalary.create({
      data
    })
  },

  async update(id: string, data: any) {
    return await prisma.staffSalary.update({
      where: { id },
      data
    })
  },

  async delete(id: string) {
    return await prisma.staffSalary.delete({
      where: { id }
    })
  },

  async getAllStaffWithSalaries() {
    return await prisma.staff.findMany({
      include: {
        workPosition: true,
        staffSalaries: {
          orderBy: { effectiveDate: 'desc' },
          take: 1
        }
      },
      orderBy: { firstName: 'asc' }
    })
  },

  async getStaffSalaryHistory(staffId: string) {
    return await prisma.staffSalary.findMany({
      where: { staffId },
      orderBy: { effectiveDate: 'desc' }
    })
  }
}
