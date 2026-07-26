import { z } from "zod"

export const attendanceMachineSchema = z.object({
  sn: z.string().min(1, "Serial Number wajib diisi"),
  name: z.string().min(1, "Nama mesin wajib diisi"),
  branchId: z.string().min(1, "Cabang wajib dipilih"),
  isActive: z.boolean(),
})

export type AttendanceMachineInput = z.infer<typeof attendanceMachineSchema>
