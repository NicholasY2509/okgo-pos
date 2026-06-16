import { z } from "zod"

export const createStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  isActive: z.boolean().default(true),
  workPositionId: z.string().min(1, "Work position is required"),
  branchId: z.string().optional().nullable(),
})

export type CreateStaffInput = z.input<typeof createStaffSchema>

export const updateStaffSchema = createStaffSchema.extend({
  id: z.string().min(1, "ID is required"),
})

export type UpdateStaffInput = z.input<typeof updateStaffSchema>
