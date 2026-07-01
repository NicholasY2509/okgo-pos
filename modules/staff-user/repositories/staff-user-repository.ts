import { prisma } from "@/lib/prisma"
import { CreateStaffUserInput, DeleteStaffUserInput } from "../schemas/staff-user-schema"

export const StaffUserRepository = {
  async getStaffUsersByStaffId(staffId: string) {
    return await prisma.staffUser.findMany({
      where: { staffId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })
  },

  async linkUserToStaff(data: CreateStaffUserInput) {
    return await prisma.staffUser.create({
      data,
    })
  },

  async unlinkUserFromStaff(data: DeleteStaffUserInput) {
    return await prisma.staffUser.delete({
      where: {
        staffId_userId: {
          staffId: data.staffId,
          userId: data.userId,
        }
      }
    })
  }
}
