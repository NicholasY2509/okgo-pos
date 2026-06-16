import { z } from "zod"

export const createStaffUserSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  userId: z.string().min(1, "User ID is required"),
})

export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>

export const deleteStaffUserSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  userId: z.string().min(1, "User ID is required"),
})

export type DeleteStaffUserInput = z.infer<typeof deleteStaffUserSchema>
