import { prisma } from "@/lib/prisma";
import { UpdatePayrollItemInput } from "../schemas/payroll";
import { Prisma } from "@/lib/generated/prisma";

export class PayrollUIService {
  static async getPayrolls() {
    return await prisma.payroll.findMany({
      include: {
        staff: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
  static async getPayrollsByMonth(monthPeriod: string) {
    return await prisma.payroll.findMany({
      where: { monthPeriod },
      include: {
        staff: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getPayrollSummaryByMonth() {
    const payrolls = await prisma.payroll.findMany({
      select: {
        id: true,
        monthPeriod: true,
        baseSalary: true,
        netSalary: true,
        status: true,
      }
    });

    const summaryMap = new Map<string, {
      monthPeriod: string,
      totalEmployees: number,
      totalBaseSalary: number,
      totalNetSalary: number,
      allPaid: boolean,
    }>();

    for (const p of payrolls) {
      const month = p.monthPeriod;
      if (!summaryMap.has(month)) {
        summaryMap.set(month, {
          monthPeriod: month,
          totalEmployees: 0,
          totalBaseSalary: 0,
          totalNetSalary: 0,
          allPaid: true,
        });
      }

      const s = summaryMap.get(month)!;
      s.totalEmployees += 1;
      s.totalBaseSalary += Number(p.baseSalary);
      s.totalNetSalary += Number(p.netSalary);
      if (p.status !== "PAID") {
        s.allPaid = false;
      }
    }

    return Array.from(summaryMap.values()).sort((a, b) => b.monthPeriod.localeCompare(a.monthPeriod));
  }
  static async getPayrollById(id: string) {
    return await prisma.payroll.findUnique({
      where: { id },
      include: {
        staff: true,
        items: {
          orderBy: { createdAt: "asc" }
        },
      },
    });
  }

  static async updatePayrollItem(input: UpdatePayrollItemInput) {
    const { payrollId, name, amount, type, notes } = input;

    // Check if payroll exists and is DRAFT
    const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
    if (!payroll) throw new Error("Payroll not found");
    if (payroll.status === "PAID") throw new Error("Cannot modify PAID payroll");

    // Add manual item
    await prisma.payrollItem.create({
      data: {
        payrollId,
        name,
        amount,
        type,
        notes,
        isManual: true,
      },
    });

    // Recalculate totals
    await this.recalculatePayroll(payrollId);
  }

  static async deletePayrollItem(itemId: string) {
    const item = await prisma.payrollItem.findUnique({ where: { id: itemId }, include: { payroll: true } });
    if (!item) throw new Error("Item not found");
    if (item.payroll.status === "PAID") throw new Error("Cannot modify PAID payroll");
    if (!item.isManual) throw new Error("Cannot delete auto-generated items");

    await prisma.payrollItem.delete({ where: { id: itemId } });
    await this.recalculatePayroll(item.payrollId);
  }

  static async settlePayroll(payrollId: string) {
    const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
    if (!payroll) throw new Error("Payroll not found");
    
    return await prisma.payroll.update({
      where: { id: payrollId },
      data: { status: "PAID" },
    });
  }

  private static async recalculatePayroll(payrollId: string) {
    const payroll = await prisma.payroll.findUnique({ 
      where: { id: payrollId },
      include: { items: true } 
    });
    
    if (!payroll) return;

    let totalAllowance = 0;
    let totalDeduction = 0;

    for (const item of payroll.items) {
      if (item.type === "ALLOWANCE") {
        totalAllowance += Number(item.amount);
      } else {
        totalDeduction += Number(item.amount);
      }
    }

    const netSalary = Number(payroll.baseSalary) + totalAllowance - totalDeduction;

    await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        totalAllowance,
        totalDeduction,
        netSalary,
      },
    });
  }
}
