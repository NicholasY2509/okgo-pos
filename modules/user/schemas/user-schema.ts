import { z } from "zod"

export const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Alamat email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Alamat email tidak valid"),
  password: z.string().optional().or(z.literal("")), // Optional for updates
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
