import { z } from "zod";

export const bookingSchema = z.object({
  branchId: z.string().min(1, "Cabang wajib dipilih"),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  selections: z.array(z.object({
    serviceId: z.string().min(1, "Layanan wajib dipilih"),
    staffId: z.string().optional(),
  })).min(1, "Minimal pilih 1 layanan"),
  date: z.string().min(1, "Tanggal wajib dipilih"),
  startTime: z.string().min(1, "Waktu wajib dipilih"),
});

export type BookingInput = z.infer<typeof bookingSchema>;
