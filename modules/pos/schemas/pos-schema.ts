import { z } from "zod";

export const posPaymentSchema = z.object({
  paymentMethodId: z.string().min(1, "Payment method is required"),
  amount: z.number().positive("Amount must be positive"),
  referenceNumber: z.string().optional(),
  voucherCode: z.string().optional(),
  notes: z.string().optional(),
});

export const posItemServiceSchema = z.object({
  type: z.literal("SERVICE"),
  serviceId: z.string().min(1, "Service ID is required"),
  quantity: z.number().int().min(1).default(1),
  staffId: z.string().min(1, "Staff is required"),
  roomId: z.string().min(1, "Room is required"),
  discountAmount: z.number().nonnegative().default(0),
  isVoucherRedemption: z.boolean().optional(),
  customerVoucherId: z.string().optional(),
  voucherCode: z.string().optional(),
});

export const posItemVoucherPacketSchema = z.object({
  type: z.literal("VOUCHER_PACKET"),
  voucherPacketId: z.string().min(1, "Voucher Packet ID is required"),
  quantity: z.number().int().min(1).default(1),
  discountAmount: z.number().nonnegative().default(0),
});

export const posCheckoutSchema = z.object({
  branchId: z.string().min(1, "Branch ID is required"),
  customerId: z.string().optional(),
  cashierId: z.string().optional(),
  isPayLater: z.boolean().default(false).optional(),

  items: z.array(
    z.discriminatedUnion("type", [
      posItemServiceSchema,
      posItemVoucherPacketSchema,
    ])
  ).min(1, "At least one item is required"),

  payments: z.array(posPaymentSchema).optional(),
});

export type PosCheckoutInput = z.infer<typeof posCheckoutSchema>;
export type PosItemServiceInput = z.infer<typeof posItemServiceSchema>;
export type PosItemVoucherPacketInput = z.infer<typeof posItemVoucherPacketSchema>;
export type PosPaymentInput = z.infer<typeof posPaymentSchema>;

export const posDirectRedemptionSchema = z.object({
  branchId: z.string().min(1, "Branch ID is required"),
  customerVoucherId: z.string().min(1, "Customer Voucher ID is required"),
  roomId: z.string().min(1, "Room ID is required"),
  staffId: z.string().min(1, "Staff ID is required"),
});
export type PosDirectRedemptionInput = z.infer<typeof posDirectRedemptionSchema>;
