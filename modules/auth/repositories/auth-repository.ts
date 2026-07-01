import { prisma } from "@/lib/prisma";

export const AuthRepository = {
  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  async getBranchBySubdomain(subdomain: string) {
    return await prisma.branch.findUnique({
      where: { subdomain },
    });
  },

  async getBranchStaffAssignment(userId: string, branchId: string) {
    return await prisma.branchStaff.findFirst({
      where: {
        staff: {
          staffUsers: { some: { userId } }
        },
        branchId,
      },
      include: {
        role: true
      }
    });
  },

  async getAdminAssignment(userId: string) {
    return await prisma.branchStaff.findFirst({
      where: {
        staff: {
          staffUsers: { some: { userId } }
        },
        role: {
          name: "Admin"
        }
      },
      include: {
        role: true
      }
    });
  },

  async getPrimaryAssignment(userId: string) {
    return await prisma.branchStaff.findFirst({
      where: {
        staff: {
          staffUsers: { some: { userId } }
        }
      },
      include: { role: true }
    });
  }
};
