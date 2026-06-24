import { z } from "zod";

export const discountSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  dayOfWeek: z.enum([
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ] as const, { message: "Hari wajib dipilih" }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Format waktu tidak valid (HH:mm)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Format waktu tidak valid (HH:mm)"),
  percentage: z.coerce.number().min(0).max(100, "Persentase tidak boleh lebih dari 100"),
  isActive: z.boolean().default(true),
  branchId: z.string().optional().nullable(),
});

export type DiscountInput = z.infer<typeof discountSchema>;
