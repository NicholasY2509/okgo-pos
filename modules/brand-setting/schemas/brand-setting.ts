import { z } from "zod";

export const brandSettingSchema = z.object({
  businessStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  businessEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

export type BrandSettingInput = z.infer<typeof brandSettingSchema>;
