import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be greater than or equal to 0"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute").optional().nullable(),
  isActive: z.boolean().default(true),
  categoryId: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
})

export const updateProductSchema = createProductSchema.extend({
  id: z.string().min(1),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
