"use server"

import { cookies } from "next/headers"
import { AuthError, CredentialsSignin } from "next-auth"
import {
  kioskLoginSchema,
  type KioskLoginInput,
  kioskExitSchema,
  type KioskExitInput,
} from "../schemas/kiosk-schema"
import { KioskService } from "../services/kiosk-service"
import { AuthService } from "../services/auth-service"
import { signIn, CustomAuthError } from "../auth"

export async function verifyKioskPinAction(values: KioskLoginInput) {
  try {
    const validatedFields = kioskLoginSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Invalid form data." }
    }

    const staff = await KioskService.verifyPin(validatedFields.data)

    // Create staff session cookie, expires in 1 day
    const cookieStore = await cookies()
    cookieStore.set("staff_session", staff.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })

    return { success: true, data: staff }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred."
    return { error: message }
  }
}

export async function exitKioskAction() {
  const cookieStore = await cookies()
  cookieStore.delete("staff_session")
  return { success: true }
}

export async function exitToPosAction(values: KioskExitInput) {
  try {
    const validatedFields = kioskExitSchema.safeParse(values)
    if (!validatedFields.success) {
      const firstError = validatedFields.error.issues[0]?.message
      return {
        error:
          firstError || "Data formulir tidak valid. Harap periksa input Anda.",
      }
    }

    const { email, password, subdomain } = validatedFields.data

    // 1. Verify credentials and branch access with AuthService
    await AuthService.verifyCredentials(email, password, subdomain)

    // 2. Clear staff_session cookie if it exists (for kiosk mode)
    const cookieStore = await cookies()
    cookieStore.delete("staff_session")

    // 3. Authenticate with NextAuth and redirect to /pos
    await signIn("credentials", {
      email,
      password,
      subdomain,
      redirectTo: "/pos",
    })

    return { success: true }
  } catch (error: unknown) {
    if (error instanceof CustomAuthError) {
      return { error: error.code || error.message }
    }

    if (error instanceof CredentialsSignin) {
      if (error.code && error.code !== "credentials") {
        return { error: error.code }
      }
      return { error: "Email atau kata sandi tidak valid." }
    }

    if (error instanceof AuthError) {
      const customCode = (error as AuthError & { code?: string }).code
      if (customCode && customCode !== "credentials") {
        return { error: customCode }
      }

      const causeMessage = (error.cause as { err?: Error } | undefined)?.err
        ?.message
      if (causeMessage) {
        return { error: causeMessage }
      }

      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau kata sandi tidak valid." }
        case "AccessDenied":
          return { error: "Akses ditolak." }
        default:
          return { error: "Terjadi kesalahan saat masuk. Silakan coba lagi." }
      }
    }

    if (error instanceof Error) {
      if (
        (error as Error & { digest?: string }).digest?.startsWith?.(
          "NEXT_REDIRECT"
        ) ||
        error.message === "NEXT_REDIRECT"
      ) {
        throw error
      }
      return { error: error.message }
    }

    return { error: "Terjadi kesalahan yang tidak terduga." }
  }
}
