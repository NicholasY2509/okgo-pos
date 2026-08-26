import { z } from "zod"

export const attendanceStatusSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi").max(20, "Maksimal 20 karakter"),
  name: z.string().min(1, "Nama status wajib diisi"),
  description: z.string().optional().nullable(),
  isPenaltyApplicable: z.boolean().default(false),
  penaltyType: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED").optional().nullable(),
  penaltyAmount: z.coerce.number().min(0, "Penalti minimal 0").optional().nullable(),
})

export type AttendanceStatusInput = z.infer<typeof attendanceStatusSchema>
