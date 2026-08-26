import { z } from "zod";

export const PayrollInputSchema = z.object({
  staffId: z.string().cuid("Invalid Staff ID"),
  monthPeriod: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
  startDate: z.date(),
  endDate: z.date(),
});

export type PayrollInput = z.infer<typeof PayrollInputSchema>;

export type PayslipComponent = {
  name: string;
  amount: number;
  type: "ALLOWANCE" | "DEDUCTION";
  notes?: string;
  isManual?: boolean;
};

export type PayslipResult = {
  staffId: string;
  monthPeriod: string;
  startDate: Date;
  endDate: Date;
  baseSalary: number;
  totalAllowance: number;
  totalDeduction: number;
  netSalary: number;
  components: PayslipComponent[];
};

export const GenerateBatchPayrollSchema = z.object({
  monthPeriod: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
  startDate: z.date(),
  endDate: z.date(),
});

export type GenerateBatchPayrollInput = z.infer<typeof GenerateBatchPayrollSchema>;

export const UpdatePayrollItemSchema = z.object({
  payrollId: z.string(),
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  type: z.enum(["ALLOWANCE", "DEDUCTION"]),
  notes: z.string().optional(),
});

export type UpdatePayrollItemInput = z.infer<typeof UpdatePayrollItemSchema>;

