import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Harap masukkan alamat email yang valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
  subdomain: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
