import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
