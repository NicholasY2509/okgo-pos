import { z } from "zod"

export const createWorkPositionSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional(),
})

export type CreateWorkPositionInput = z.infer<typeof createWorkPositionSchema>

export const updateWorkPositionSchema = createWorkPositionSchema.extend({
  id: z.string().min(1, "ID wajib diisi"),
})

export type UpdateWorkPositionInput = z.infer<typeof updateWorkPositionSchema>
