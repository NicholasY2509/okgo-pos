import { z } from "zod"

export const reviewSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  rating: z.number().min(1, "Minimum rating is 1").max(5, "Maximum rating is 5"),
  comment: z.string().optional(),
})

export type ReviewSessionInput = z.infer<typeof reviewSessionSchema>

export const portalReviewsQuerySchema = z.object({
  branchId: z.string().trim().min(1, "ID cabang wajib diisi."),
})

export const portalSubmitReviewSchema = z.object({
  sessionId: z.string().trim().min(1, "ID sesi wajib diisi."),
  branchId: z.string().trim().min(1, "ID cabang wajib diisi."),
  rating: z
    .number()
    .int("Rating harus berupa bilangan bulat.")
    .min(1, "Rating minimal 1 bintang.")
    .max(5, "Rating maksimal 5 bintang."),
  comment: z.string().trim().max(1000, "Ulasan maksimal 1000 karakter.").optional(),
})

export type PortalReviewsQueryInput = z.infer<typeof portalReviewsQuerySchema>
export type PortalSubmitReviewInput = z.infer<typeof portalSubmitReviewSchema>
