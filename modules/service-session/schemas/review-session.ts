import { z } from "zod"

export const reviewSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  rating: z.number().min(1, "Minimum rating is 1").max(5, "Maximum rating is 5"),
  comment: z.string().optional(),
})

export type ReviewSessionInput = z.infer<typeof reviewSessionSchema>
