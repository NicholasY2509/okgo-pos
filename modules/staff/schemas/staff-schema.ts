import { z } from "zod"

export const createStaffSchema = z.object({
  firstName: z.string().min(1, "Nama depan wajib diisi"),
  lastName: z.string().min(1, "Nama belakang wajib diisi"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")).nullable(),
  isActive: z.boolean().default(true),
  workPositionId: z.string().min(1, "Posisi kerja wajib diisi"),
  branchId: z.string().optional().nullable(),
})

export type CreateStaffInput = z.input<typeof createStaffSchema>

export const updateStaffSchema = createStaffSchema.extend({
  id: z.string().min(1, "ID wajib diisi"),
})

export type UpdateStaffInput = z.input<typeof updateStaffSchema>
