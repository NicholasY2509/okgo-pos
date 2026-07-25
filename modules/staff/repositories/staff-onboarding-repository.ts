import { prisma } from "@/lib/prisma";
import { StaffOnboardingInput } from "../schemas/staff-onboarding-schema";

export const StaffOnboardingRepository = {
  async onboardUser(data: StaffOnboardingInput & { hashedPassword?: string }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create Staff
      const staff = await tx.staff.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          staffIdNumber: data.staffIdNumber || null,
          workPositionId: data.workPositionId,
          isActive: true, // Default to true
        },
      });

      let user = null;

      // 2. Create User and StaffUser mapping if requested
      if (data.createUserAccount && data.email && data.hashedPassword) {
        user = await tx.user.create({
          data: {
            email: data.email,
            password: data.hashedPassword,
            name: `${data.firstName} ${data.lastName}`,
          },
        });

        await tx.staffUser.create({
          data: {
            staffId: staff.id,
            userId: user.id,
          },
        });
      }

      // 3. Create BranchStaff mapping
      await tx.branchStaff.create({
        data: {
          staffId: staff.id,
          branchId: data.branchId,
          roleId: data.roleId,
        },
      });

      return { user, staff };
    });
  },

  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  },
};
