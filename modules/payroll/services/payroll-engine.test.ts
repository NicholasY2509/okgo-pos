import { describe, it, expect, vi, beforeEach } from "vitest";
import { PayrollEngine } from "./payroll-engine";
import { PayrollRepository } from "../repositories/payroll-repository";

vi.mock("../repositories/payroll-repository", () => ({
  PayrollRepository: {
    findPayrollByPeriod: vi.fn(),
    deletePayroll: vi.fn(),
    getStaffSalaryByPeriod: vi.fn(),
    getAttendancesByPeriod: vi.fn(),
    getStaffApplicableSalaryComponents: vi.fn(),
    getStaffIncentivesByPeriod: vi.fn(),
    createPayroll: vi.fn(),
  },
}));

describe("PayrollEngine - generatePayroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw an error if payroll is already PAID for the period", async () => {
    vi.mocked(PayrollRepository.findPayrollByPeriod).mockResolvedValue({
      id: "pay-1",
      status: "PAID",
    } as never);

    await expect(
      PayrollEngine.generatePayroll({
        staffId: "stf-1",
        monthPeriod: "2026-10",
        startDate: new Date("2026-10-01"),
        endDate: new Date("2026-10-31"),
      })
    ).rejects.toThrow("Payroll for this period is already paid");
  });

  it("should calculate net salary correctly with base salary, fixed allowance, and deductions", async () => {
    vi.mocked(PayrollRepository.findPayrollByPeriod).mockResolvedValue(null);
    vi.mocked(PayrollRepository.getStaffSalaryByPeriod).mockResolvedValue({
      baseSalary: 3000000,
    } as never);

    vi.mocked(PayrollRepository.getAttendancesByPeriod).mockResolvedValue([
      {
        attendanceDate: new Date("2026-10-01"),
        status: { code: "PRESENT" },
        overtimeHours: 0,
      },
      {
        attendanceDate: new Date("2026-10-02"),
        status: { code: "PRESENT" },
        overtimeHours: 0,
      },
    ] as never);

    vi.mocked(PayrollRepository.getStaffApplicableSalaryComponents).mockResolvedValue([
      {
        amount: null,
        salaryComponent: {
          name: "Tunjangan Makan",
          type: "FIXED",
          amount: 500000,
          isDeduction: false,
        },
      },
      {
        amount: null,
        salaryComponent: {
          name: "Potongan Kasbon",
          type: "FIXED",
          amount: 200000,
          isDeduction: true,
        },
      },
    ] as never);

    vi.mocked(PayrollRepository.getStaffIncentivesByPeriod).mockResolvedValue([]);
    vi.mocked(PayrollRepository.createPayroll).mockResolvedValue({ id: "pay-new" } as never);

    const result = await PayrollEngine.generatePayroll({
      staffId: "stf-1",
      monthPeriod: "2026-10",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
    });

    expect(PayrollRepository.createPayroll).toHaveBeenCalledWith(
      expect.objectContaining({
        baseSalary: 3000000,
        totalAllowance: 500000,
        totalDeduction: 200000,
        netSalary: 3300000, // 3,000,000 + 500,000 - 200,000
      })
    );
    expect(result.id).toBe("pay-new");
  });

  it("should award perfect month bonus when there are 0 absences and 0 lates", async () => {
    vi.mocked(PayrollRepository.findPayrollByPeriod).mockResolvedValue(null);
    vi.mocked(PayrollRepository.getStaffSalaryByPeriod).mockResolvedValue({
      baseSalary: 2500000,
    } as never);

    vi.mocked(PayrollRepository.getAttendancesByPeriod).mockResolvedValue([
      {
        attendanceDate: new Date("2026-10-01"),
        status: { code: "PRESENT" },
        overtimeHours: 0,
      },
    ] as never);

    vi.mocked(PayrollRepository.getStaffApplicableSalaryComponents).mockResolvedValue([
      {
        amount: null,
        salaryComponent: {
          name: "Bonus Rajin Bulanan",
          type: "CONDITIONAL_PERFECT_MONTH",
          amount: 300000,
          isDeduction: false,
        },
      },
    ] as never);

    vi.mocked(PayrollRepository.getStaffIncentivesByPeriod).mockResolvedValue([]);
    vi.mocked(PayrollRepository.createPayroll).mockResolvedValue({ id: "pay-bonus" } as never);

    await PayrollEngine.generatePayroll({
      staffId: "stf-1",
      monthPeriod: "2026-10",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
    });

    expect(PayrollRepository.createPayroll).toHaveBeenCalledWith(
      expect.objectContaining({
        totalAllowance: 300000,
        netSalary: 2800000, // 2,500,000 + 300,000
      })
    );
  });
});
