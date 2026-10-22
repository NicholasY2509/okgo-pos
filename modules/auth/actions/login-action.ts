"use server"

import { signIn, CustomAuthError } from "@/modules/auth/auth"
import { AuthError, CredentialsSignin } from "next-auth"
import { loginSchema, type LoginInput } from "@/modules/auth/schemas/login"

export async function loginAction(values: LoginInput): Promise<string | undefined> {
  try {
    const validatedFields = loginSchema.safeParse(values)

    if (!validatedFields.success) {
      const firstError = validatedFields.error.issues[0]?.message
      return firstError || "Data formulir tidak valid. Harap periksa input Anda."
    }

    const { email, password, subdomain } = validatedFields.data

    await signIn("credentials", {
      email,
      password,
      subdomain,
      redirectTo: subdomain === "admin" ? "/" : "/pos",
    })
  } catch (error) {
    if (error instanceof CustomAuthError) {
      return error.code || error.message
    }

    if (error instanceof CredentialsSignin) {
      if (error.code && error.code !== "credentials") {
        return error.code
      }
      return "Email atau kata sandi tidak valid."
    }

    if (error instanceof AuthError) {
      const customCode = (error as any).code
      if (customCode && customCode !== "credentials") {
        return customCode
      }

      const causeMessage = (error.cause as any)?.err?.message
      if (causeMessage) {
        return causeMessage
      }

      switch (error.type) {
        case "CredentialsSignin":
          return "Email atau kata sandi tidak valid."
        case "AccessDenied":
          return "Akses ditolak."
        default:
          return "Terjadi kesalahan saat masuk. Silakan coba lagi."
      }
    }

    throw error // Let Next.js handle redirect errors
  }
}
