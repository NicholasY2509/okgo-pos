import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Harga harus lebih besar atau sama dengan 0"),
  duration: z.coerce.number().min(1, "Durasi minimal 1 menit").optional().nullable(),
  isVip: z.boolean().default(false),
  isActive: z.boolean().default(true),
  categoryId: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
})

export const updateProductSchema = createProductSchema.extend({
  id: z.string().min(1),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
