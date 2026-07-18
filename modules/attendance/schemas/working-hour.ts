import { z } from "zod";

export const workingHourSchema = z.object({
  name: z.string().min(1, "Name is required"),
  clockIn: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Must be in HH:MM format"),
  clockOut: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Must be in HH:MM format"),
});

export type WorkingHourInput = z.infer<typeof workingHourSchema>;
