import { prisma } from "@/lib/prisma"
import { SalaryComponentInput, UpdateSalaryComponentInput } from "../schemas/salary-component"

export const SalaryComponentRepository = {
  async getAll() {
    return await prisma.salaryComponent.findMany({
      orderBy: { name: "asc" },
      include: {
        workPositions: true
      }
    })
  },

  async getById(id: string) {
    return await prisma.salaryComponent.findUnique({
      where: { id },
      include: {
        workPositions: true
      }
    })
  },

  async getByCode(code: string) {
    return await prisma.salaryComponent.findUnique({
      where: { code }
    })
  },

  async create(data: SalaryComponentInput) {
    return await prisma.salaryComponent.create({
      data: {
        code: data.code,
        name: data.name,
        isDeduction: data.isDeduction,
        type: data.type,
        amount: data.amount,
        workPositions: {
          connect: data.workPositionIds?.map((id) => ({ id })) || []
        }
      }
    })
  },

  async update(id: string, data: Partial<SalaryComponentInput>) {
    return await prisma.salaryComponent.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        isDeduction: data.isDeduction,
        type: data.type,
        amount: data.amount,
        ...(data.workPositionIds !== undefined && {
          workPositions: {
            set: data.workPositionIds.map((wpId) => ({ id: wpId }))
          }
        })
      }
    })
  },

  async delete(id: string) {
    return await prisma.salaryComponent.delete({
      where: { id }
    })
  }
}
