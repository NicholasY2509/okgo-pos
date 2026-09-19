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
    const totalLates = attendances.filter(a => a.status?.code === "LATE").length;
    const totalAbsences = attendances.filter(a => a.status?.code === "ABSENT").length;

    const totalOvertimeHours = attendances.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
    const overtimeRate = 0; // TODO: Fetch from settings or SalaryComponent

    // 4. Fetch Components
    const staffComponents = await PayrollRepository.getStaffApplicableSalaryComponents(staffId);

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

      let notes = "";

      if (comp.type === "FIXED") {
        calculatedAmount = amount;
      } else if (comp.type === "PERCENTAGE") {
        calculatedAmount = (amount / 100) * baseSalary;
        notes = `${amount}% dari Gaji Pokok`;
      } else if (comp.type === "PER_ATTENDANCE") {
        calculatedAmount = amount * totalDaysPresent;
        notes = `${totalDaysPresent} kali hadir`;
      } else if (comp.type === "PER_HOUR") {
        calculatedAmount = amount * totalOvertimeHours;
        notes = `${totalOvertimeHours} jam lembur`;
      } else if (comp.type === "PER_LATE") {
        calculatedAmount = amount * totalLates;
        notes = `${totalLates} kali terlambat`;
      } else if (comp.type === "CONDITIONAL_PERFECT_MONTH") {
        // Perfect month: present for at least 1 day, with zero absences and zero lates
        if (totalDaysPresent > 0 && totalAbsences === 0 && totalLates === 0) {
          calculatedAmount = amount;
          notes = "1 bulan penuh";
        }
      } else if (comp.type === "CONDITIONAL_PERFECT_WEEK") {
        // Group attendances by week (using Sunday as week start for grouping)
        const weekStats: Record<number, { present: number, late: number, absent: number }> = {};

        for (const att of attendances) {
          const d = att.attendanceDate;
          // Unique identifier for the week
          const weekId = Math.floor((d.getTime() - d.getDay() * 86400000) / (7 * 86400000));
          if (!weekStats[weekId]) weekStats[weekId] = { present: 0, late: 0, absent: 0 };

          if (att.status?.code === "PRESENT") weekStats[weekId].present++;
          else if (att.status?.code === "LATE") weekStats[weekId].late++;
          else if (att.status?.code === "ABSENT") weekStats[weekId].absent++;
        }

        let perfectWeeks = 0;
        for (const stats of Object.values(weekStats)) {
          // A perfect week requires some presence, zero lates, and zero absences
          if (stats.present > 0 && stats.late === 0 && stats.absent === 0) {
            perfectWeeks++;
          }
        }
        calculatedAmount = amount * perfectWeeks;
        if (perfectWeeks > 0) {
          notes = `${perfectWeeks} minggu full`;
        }
      }

      if (calculatedAmount > 0) {
        payslipComponents.push({
          name: comp.name,
          amount: calculatedAmount,
          type: comp.isDeduction ? "DEDUCTION" : "ALLOWANCE",
          notes: notes || undefined,
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
