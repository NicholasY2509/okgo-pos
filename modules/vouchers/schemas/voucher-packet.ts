import { z } from "zod"

export const voucherPacketSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama wajib diisi"),
  quantity: z.coerce.number().min(1, "Kuantitas minimal 1"),
  price: z.coerce.number().min(0, "Harga minimal 0"),
  duration: z.coerce.number().optional().nullable(),
  isActive: z.boolean().default(true),
  productId: z.string().min(1, "Produk wajib diisi"),
})

export type VoucherPacketInput = z.infer<typeof voucherPacketSchema>
