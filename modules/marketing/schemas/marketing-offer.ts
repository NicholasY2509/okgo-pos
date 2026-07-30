import { z } from "zod";

export const marketingOfferSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional().nullable(),
  features: z.string().optional().nullable(),
  normalPrice: z.coerce.number().min(0, "Harga minimal 0").optional().nullable(),
  discountPrice: z.coerce.number().min(0, "Harga promo minimal 0"),
  isActive: z.boolean().default(true),
  order: z.coerce.number().default(0),
});

export type MarketingOfferInput = z.infer<typeof marketingOfferSchema>;
