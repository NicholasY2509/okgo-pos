import { z } from "zod";

export const bookingSchema = z.object({
  branchId: z.string().min(1, "Cabang wajib dipilih"),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  selections: z.array(z.object({
    serviceId: z.string().optional().or(z.literal("")),
    staffId: z.string().optional(),
    appliedVoucherId: z.string().optional(),
    appliedVoucherCode: z.string().optional(),
  })).optional(),
  date: z.string().min(1, "Tanggal wajib dipilih"),
  startTime: z.string().min(1, "Waktu wajib dipilih"),
  appliedVoucherId: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
