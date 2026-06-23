import { z } from "zod";

export const paymentMethodSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CASH", "EDC", "QRIS", "TRANSFER", "VOUCHER"]),
  isActive: z.boolean(),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
