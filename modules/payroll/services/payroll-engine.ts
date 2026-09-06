import { PayrollRepository } from "../repositories/payroll-repository";
import { PayrollInput, PayslipComponent } from "../schemas/payroll";
import { Prisma } from "@/lib/generated/prisma";

export class PayrollEngine {
  static async generatePayroll(input: PayrollInput) {
    const { staffId, monthPeriod, startDate, endDate } = input;

    // 1. Check if payroll already exists for this period
    const existingPayroll = await PayrollRepository.findPayrollByPeriod(staffId, monthPeriod);
    if (existingPayroll) {
      if (existingPayroll.status === "PAID") {
        throw new Error("Payroll for this period is already paid and cannot be regenerated.");
      }

      await PayrollRepository.deletePayroll(existingPayroll.id);
    }

    // 2. Fetch Base Salary
    const staffSalary = await PayrollRepository.getStaffSalaryByPeriod(staffId, startDate);
    const baseSalary = staffSalary ? Number(staffSalary.baseSalary) : 0;

    // 3. Fetch Attendances & Overtime
    const attendances = await PayrollRepository.getAttendancesByPeriod(staffId, startDate, endDate);

    // We assume 1 attendance record = 1 working day (simplification)
    const totalWorkingDays = attendances.length;
    const totalDaysPresent = attendances.filter(a => a.status?.code === "PRESENT" || a.status?.code === "LATE").length;

    const totalOvertimeHours = attendances.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
    const overtimeRate = 0; // TODO: Fetch from settings or SalaryComponent

    // 4. Fetch Components
    const staffComponents = await PayrollRepository.getStaffSalaryComponents(staffId);

    // 5. Fetch Incentives and Commissions
    const staffIncentives = await PayrollRepository.getStaffIncentivesByPeriod(staffId, startDate, endDate);

    const cashierIncentives = staffIncentives.filter(i => i.type === "CASHIER_COMMISSION");
    const totalCashierIncentives = cashierIncentives.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const therapistCommissions = staffIncentives.filter(i => i.type === "SERVICE_COMMISSION");
    const totalTherapistCommissions = therapistCommissions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // 6. Calculate Components
    const payslipComponents: PayslipComponent[] = [];
    let totalAllowance = 0;
    let totalDeduction = 0;

    for (const sc of staffComponents) {
      const comp = sc.salaryComponent;
      let amount = Number(sc.amount !== null ? sc.amount : comp.amount);
      let calculatedAmount = 0;

      if (comp.type === "FIXED") {
        calculatedAmount = amount;
      } else if (comp.type === "PERCENTAGE") {
        calculatedAmount = (amount / 100) * baseSalary;
      } else if (comp.type === "PER_ATTENDANCE") {
        calculatedAmount = amount * totalDaysPresent;
      }

      if (calculatedAmount > 0) {
        payslipComponents.push({
          name: comp.name,
          amount: calculatedAmount,
          type: comp.isDeduction ? "DEDUCTION" : "ALLOWANCE",
        });
        if (comp.isDeduction) totalDeduction += calculatedAmount;
        else totalAllowance += calculatedAmount;
      }
    }

    // Overtime
    if (totalOvertimeHours > 0 && overtimeRate > 0) {
      const otAmount = totalOvertimeHours * overtimeRate;
      payslipComponents.push({
        name: `Overtime (${totalOvertimeHours} hours)`,
        amount: otAmount,
        type: "ALLOWANCE",
      });
      totalAllowance += otAmount;
    }

    // Cashier Incentives
    if (totalCashierIncentives > 0) {
      payslipComponents.push({
        name: "Cashier Incentives",
        amount: totalCashierIncentives,
        type: "ALLOWANCE",
      });
      totalAllowance += totalCashierIncentives;
    }

    // Therapist Commissions
    if (totalTherapistCommissions > 0) {
      payslipComponents.push({
        name: "Therapist Commissions",
        amount: totalTherapistCommissions,
        type: "ALLOWANCE",
      });
      totalAllowance += totalTherapistCommissions;
    }

    // 7. Calculate Penalties
    for (const att of attendances) {
      if (att.status?.isPenaltyApplicable) {
        const penaltyType = att.status.penaltyType;
        const penaltyValue = Number(att.status.penaltyAmount || 0);
        let penaltyAmount = 0;

        if (penaltyType === "FIXED") {
          penaltyAmount = penaltyValue;
        } else if (penaltyType === "PERCENTAGE") {
          // Assuming percentage of base salary divided by typical working days (e.g. 22)
          // Or percentage of base salary per day
          const assumedWorkingDays = 22; // Typical working days in a month
          penaltyAmount = (penaltyValue / 100) * (baseSalary / assumedWorkingDays);
        }

        if (penaltyAmount > 0) {
          payslipComponents.push({
            name: `Penalty: ${att.status.name} (${att.attendanceDate.toISOString().split('T')[0]})`,
            amount: penaltyAmount,
            type: "DEDUCTION",
          });
          totalDeduction += penaltyAmount;
        }
      }
    }

    const netSalary = baseSalary + totalAllowance - totalDeduction;

    // 8. Store in Database
    const payrollData: Prisma.PayrollCreateInput = {
      staff: { connect: { id: staffId } },
      monthPeriod,
      startDate,
      endDate,
      baseSalary,
      totalAllowance,
      totalDeduction,
      netSalary,
      status: "DRAFT",
      items: {
        create: payslipComponents.map((pc) => ({
          name: pc.name,
          amount: pc.amount,
          type: pc.type,
          isManual: false,
          notes: pc.notes,
        })),
      },
    };

    return await PayrollRepository.createPayroll(payrollData);
  }
}
