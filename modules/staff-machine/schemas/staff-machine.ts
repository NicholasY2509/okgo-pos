import { z } from "zod"

export const staffMachineSchema = z.object({
  staffId: z.string().min(1, "Staff wajib dipilih"),
  machineId: z.string().min(1, "Mesin wajib dipilih"),
  machineUserId: z.string().min(1, "ID Mesin wajib diisi"),
})

export type StaffMachineInput = z.infer<typeof staffMachineSchema>
