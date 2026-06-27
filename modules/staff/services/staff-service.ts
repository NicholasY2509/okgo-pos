import { prisma } from "@/lib/prisma"
import {
  CreateStaffInput,
  UpdateStaffInput,
} from "../schemas/staff-schema"

export class StaffService {
  // --- Staff ---

  static async getAllStaff(branchId?: string) {
    return await prisma.staff.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        workPosition: true,
        branch: true,
        staffUsers: {
          include: {
            user: true,
          }
        }
      },
    })
  }

  static async getStaffById(id: string) {
    return await prisma.staff.findUnique({
      where: { id },
      include: {
        workPosition: true,
        branch: true,
        staffUsers: {
          include: {
            user: true,
          }
        }
      },
    })
  }

  static async createStaff(data: CreateStaffInput) {
    return await prisma.staff.create({
      data,
    })
  }

  static async updateStaff(id: string, data: Omit<UpdateStaffInput, "id">) {
    return await prisma.staff.update({
      where: { id },
      data,
    })
  }

  static async deleteStaff(id: string) {
    return await prisma.staff.delete({
      where: { id },
    })
  }
}
