"use server"

import { revalidatePath } from "next/cache"
import { StaffUserService } from "../services/staff-user-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"
import {
  createStaffUserSchema,
  deleteStaffUserSchema,
  type CreateStaffUserInput,
  type DeleteStaffUserInput,
} from "../schemas/staff-user-schema"

export async function linkUserToStaffAction(values: CreateStaffUserInput) {
  try {
    await AuthGuardService.requireAuth()
    const validatedFields = createStaffUserSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid data." }
    }

    const staffUser = await StaffUserService.linkUserToStaff(validatedFields.data)
    revalidatePath("/admin/staff")
    return { success: true, data: staffUser }
  } catch (error: unknown) {
    console.error("Failed to link user to staff:", error)
    const message = error instanceof Error ? error.message : "Failed to link user to staff."
    return { error: message }
  }
}

export async function unlinkUserFromStaffAction(values: DeleteStaffUserInput) {
  try {
    await AuthGuardService.requireAuth()
    const validatedFields = deleteStaffUserSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid data." }
    }

    await StaffUserService.unlinkUserFromStaff(validatedFields.data)
    revalidatePath("/admin/staff")
    return { success: true }
  } catch (error: unknown) {
    console.error("Failed to unlink user from staff:", error)
    const message = error instanceof Error ? error.message : "Failed to unlink user from staff."
    return { error: message }
  }
}

