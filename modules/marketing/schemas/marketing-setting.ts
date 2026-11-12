import { z } from "zod";

export const marketingSettingSchema = z.object({
  isMaintenanceMode: z.boolean(),
});

export type MarketingSettingInput = z.infer<typeof marketingSettingSchema>;
