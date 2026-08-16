import { z } from "zod"

export const kioskLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  pin: z.string().min(4, "PIN must be at least 4 digits"),
})

export type KioskLoginInput = z.infer<typeof kioskLoginSchema>

export const kioskExitSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type KioskExitInput = z.infer<typeof kioskExitSchema>
