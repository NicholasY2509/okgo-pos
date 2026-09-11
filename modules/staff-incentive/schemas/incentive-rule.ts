import { z } from "zod";

export const incentiveTierSchema = z.object({
  id: z.string().optional(),
  minTarget: z.coerce.number().min(0, "Target minimum harus >= 0"),
  maxTarget: z.coerce.number().nullable().optional(),
  amount: z.coerce.number().nullable().optional(),
  percentage: z.coerce.number().nullable().optional(),
});

export const incentiveRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama aturan wajib diisi"),
  targetWorkPositionIds: z.array(z.string()).min(1, "Minimal pilih satu posisi kerja"),
  ruleType: z.enum(["SERVICE_PRICE_PERCENTAGE", "VOUCHER_SALES_TIERED", "TOTAL_SALES_TIERED", "FIXED_AMOUNT"]),
  flatAmount: z.coerce.number().nullable().optional(),
  flatPercentage: z.coerce.number().nullable().optional(),
  isActive: z.boolean().default(true),
  tiers: z.array(incentiveTierSchema).optional().default([]),
});

export type IncentiveTierInput = z.infer<typeof incentiveTierSchema>;
export type IncentiveRuleInput = z.infer<typeof incentiveRuleSchema>;
