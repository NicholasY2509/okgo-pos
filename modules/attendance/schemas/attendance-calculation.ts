import { z } from "zod"

export const attendanceCalculationSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
})

export type AttendanceCalculationInput = z.infer<typeof attendanceCalculationSchema>
