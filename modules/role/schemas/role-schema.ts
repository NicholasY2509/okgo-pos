import { z } from "zod"

export const createRoleSchema = z.object({
  name: z.string().min(1, "Nama Role harus diisi"),
  description: z.string().optional(),
})

export const updateRoleSchema = createRoleSchema.extend({
  id: z.string().min(1, "ID Role harus diisi"),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
