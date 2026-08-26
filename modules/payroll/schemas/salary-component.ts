import { z } from "zod"

export const salaryComponentSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi"),
  name: z.string().min(1, "Nama komponen wajib diisi"),
  isDeduction: z.boolean(),
  type: z.string(),
  amount: z.number().min(0, "Jumlah tidak boleh negatif"),
})

export type SalaryComponentInput = z.infer<typeof salaryComponentSchema>

export const updateSalaryComponentSchema = salaryComponentSchema.extend({
  id: z.string().min(1, "ID wajib diisi"),
})

export type UpdateSalaryComponentInput = z.infer<typeof updateSalaryComponentSchema>
