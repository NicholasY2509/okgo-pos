import { z } from "zod";

export const voucherPacketSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama wajib diisi"),
  codeSuffix: z.string().max(10, "Maksimal 10 karakter").toUpperCase().optional().nullable(),
  price: z.coerce.number().min(0, "Harga minimal 0"),
  totalVisitCount: z.coerce.number().min(1, "Harus lebih besar dari 0").optional().nullable(),
  totalCreditAmount: z.coerce.number().min(1, "Harus lebih besar dari 0").optional().nullable(),
  validityDays: z.coerce.number().min(1, "Masa berlaku minimal 1 hari").optional().nullable(),
  isActive: z.boolean().default(true),
  productId: z.string().optional().nullable(),
}).refine(data => data.totalVisitCount || data.totalCreditAmount, {
  message: "Salah satu dari totalVisitCount atau totalCreditAmount wajib diisi",
  path: ["totalVisitCount"]
});

export type VoucherPacketInput = z.infer<typeof voucherPacketSchema>;
