import { prisma } from "@/lib/prisma"
import { CreateStaffInput, UpdateStaffInput } from "../schemas/staff-schema"

export const StaffRepository = {
  async getAllStaff(branchId?: string) {
    return await prisma.staff.findMany({
      where: branchId ? { branchStaffs: { some: { branchId } } } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        workPosition: true,
        staffUsers: {
          include: {
            user: true,
          }
        }
      },
    })
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
  }
}
