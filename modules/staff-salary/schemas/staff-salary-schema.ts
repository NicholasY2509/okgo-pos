import { z } from "zod"

export const staffSalarySchema = z.object({
  staffId: z.string({ error: "Staf wajib dipilih" }).min(1, "Staf wajib dipilih"),
  baseSalary: z.coerce.number().min(0, "Gaji pokok minimal 0"),
  effectiveDate: z.date({ error: "Tanggal efektif wajib diisi" }),
})

export type StaffSalaryInput = z.infer<typeof staffSalarySchema>
