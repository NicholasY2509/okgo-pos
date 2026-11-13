import { z } from "zod"

export const serviceSessionStatusEnum = z.enum([
  "ALL",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
])

export const serviceSessionQuerySchema = z.object({
  search: z.string().optional(),
  status: serviceSessionStatusEnum.optional(),
  roomId: z.string().optional(),
  staffId: z.string().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
})

export type ServiceSessionQueryInput = z.infer<typeof serviceSessionQuerySchema>
export type ServiceSessionStatus = z.infer<typeof serviceSessionStatusEnum>
