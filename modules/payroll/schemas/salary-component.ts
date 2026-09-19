import { z } from "zod"

export const SALARY_COMPONENT_TYPES = [
  "FIXED",
  "PERCENTAGE",
  "PER_ATTENDANCE",
  "PER_HOUR",
  "PER_LATE",
  "CONDITIONAL_PERFECT_WEEK",
  "CONDITIONAL_PERFECT_MONTH"
] as const;

export const salaryComponentSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi"),
  name: z.string().min(1, "Nama komponen wajib diisi"),
  isDeduction: z.boolean().default(false),
  type: z.enum(SALARY_COMPONENT_TYPES, {
    errorMap: () => ({ message: "Tipe komponen wajib dipilih" }),
  }),
  amount: z.coerce.number().min(0, "Jumlah tidak boleh negatif"),
  workPositionIds: z.array(z.string()).default([]),
})

export type SalaryComponentInput = z.infer<typeof salaryComponentSchema>

export const updateSalaryComponentSchema = salaryComponentSchema.extend({
  id: z.string().min(1, "ID wajib diisi"),
})

export type UpdateSalaryComponentInput = z.infer<typeof updateSalaryComponentSchema>
