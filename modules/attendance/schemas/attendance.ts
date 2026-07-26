import { z } from "zod"

export const attendanceSchema = z.object({
  staffId: z.string().min(1, "Staf wajib dipilih"),
  attendanceDate: z.date(),
  clockIn: z.date().optional().nullable(),
  clockOut: z.date().optional().nullable(),
  statusId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  clockInMachineId: z.string().optional().nullable(),
  clockOutMachineId: z.string().optional().nullable(),
  attendanceWorkingHourId: z.string().optional().nullable(),
})

export type AttendanceInput = z.infer<typeof attendanceSchema>
