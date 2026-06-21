import { z } from "zod"

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional().nullable(),
})

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().min(1),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
