import { z } from "zod";

export const promotionScheduleSchema = z.object({
  days: z.array(z.enum(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"])).min(1, "Minimal pilih 1 hari"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Format waktu tidak valid (HH:mm)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Format waktu tidak valid (HH:mm)"),
});

export const promotionConditionSchema = z.object({
  minQuantity: z.number().int().min(1).default(1),
  requiredServiceIds: z.array(z.string()).optional(),
}).optional();

export const promotionRewardSchema = z.object({
  type: z.enum(["PERCENTAGE_TOTAL", "PERCENTAGE_ITEM", "FREE_ADDON"]),
  value: z.number().min(0).optional(), // Can be null if type is FREE_ADDON
  addonServiceId: z.string().optional(), // Required if type is FREE_ADDON
}).superRefine((data, ctx) => {
  if (data.type === "FREE_ADDON" && !data.addonServiceId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Layanan tambahan wajib diisi jika tipe reward adalah FREE_ADDON",
      path: ["addonServiceId"]
    });
  }
  if (data.type !== "FREE_ADDON" && data.value === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nilai wajib diisi jika tipe reward berupa persentase",
      path: ["value"]
    });
  }
});

export const promotionSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  branchId: z.string().optional().nullable(),
  schedules: z.array(promotionScheduleSchema).min(1, "Minimal 1 jadwal wajib diisi"),
  conditions: promotionConditionSchema,
  reward: promotionRewardSchema,
});

export type PromotionInput = z.infer<typeof promotionSchema>;
export type PromotionSchedule = z.infer<typeof promotionScheduleSchema>;
export type PromotionCondition = z.infer<typeof promotionConditionSchema>;
export type PromotionReward = z.infer<typeof promotionRewardSchema>;
