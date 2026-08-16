"use server"

import { cookies } from "next/headers"
import { kioskLoginSchema, type KioskLoginInput } from "../schemas/kiosk-schema"
import { KioskService } from "../services/kiosk-service"

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
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." }
  }
}

export async function exitKioskAction() {
  const cookieStore = await cookies()
  cookieStore.delete("staff_session")
  return { success: true }
}
