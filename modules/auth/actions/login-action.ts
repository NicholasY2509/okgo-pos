"use server"

import { signIn } from "@/modules/auth/auth"
import { AuthError } from "next-auth"
import { loginSchema, type LoginInput } from "@/modules/auth/schemas/login"

export async function loginAction(values: LoginInput) {
  try {
    const validatedFields = loginSchema.safeParse(values)

    if (!validatedFields.success) {
      return "Invalid form data. Please check your inputs."
    }

    const { email, password, subdomain } = validatedFields.data

    await signIn("credentials", {
      email,
      password,
      subdomain,
      redirectTo: "/",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials."
        default:
          return "Something went wrong."
      }
    }
    throw error // Let Next.js handle redirect errors
  }
}
