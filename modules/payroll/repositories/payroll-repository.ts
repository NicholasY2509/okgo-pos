import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

export const PayrollRepository = {
  async getStaffSalaryByPeriod(staffId: string, startDate: Date) {
    // Find the latest salary effective before or on the endDate, wait, actually we should find the active one for the period.
    // Usually, we get the most recent effective date before the period ends.
    return await prisma.staffSalary.findFirst({
      where: {
        staffId,
        effectiveDate: {
          lte: startDate, // simplest logic: effective date must be on or before start of period
        },
      },
      orderBy: {
        effectiveDate: "desc",
      },
    });
  },

  async getStaffApplicableSalaryComponents(staffId: string) {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { workPositionId: true }
    });

    if (!staff) return [];

    // Position-based components
    const positionComponents = await prisma.salaryComponent.findMany({
      where: {
        workPositions: {
          some: { id: staff.workPositionId }
        }
      }
    });

    // Staff-specific overrides/additions
    const staffSpecificComponents = await prisma.staffSalaryComponent.findMany({
      where: { staffId },
      include: {
        salaryComponent: true,
      },
    });

    // Merge them
    const componentMap = new Map<string, any>();

    for (const pc of positionComponents) {
      componentMap.set(pc.id, { salaryComponent: pc, amount: null });
    }

    for (const ssc of staffSpecificComponents) {
      componentMap.set(ssc.salaryComponentId, {
        salaryComponent: ssc.salaryComponent,
        amount: ssc.amount
      });
    }

    return Array.from(componentMap.values());
  },

  async getAttendancesByPeriod(staffId: string, startDate: Date, endDate: Date) {
    return await prisma.attendance.findMany({
      where: {
        staffId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        status: true,
      },
    });
  },

  async getStaffIncentivesByPeriod(staffId: string, startDate: Date, endDate: Date) {
    return await prisma.staffIncentive.findMany({
      where: {
        staffId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  },

  async createPayroll(data: Prisma.PayrollCreateInput) {
    return await prisma.payroll.create({
      data,
      include: {
        items: true,
      },
    });
  },

  async findPayrollByPeriod(staffId: string, monthPeriod: string) {
    return await prisma.payroll.findUnique({
      where: {
        staffId_monthPeriod: {
          staffId,
          monthPeriod,
        },
      },
      include: {
        items: true,
      },
    });
  },

  async deletePayroll(id: string) {
    return await prisma.payroll.delete({
      where: { id },
    });
  }
};
