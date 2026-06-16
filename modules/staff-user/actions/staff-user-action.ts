"use server"

import { revalidatePath } from "next/cache"
import { StaffUserService } from "../services/staff-user-service"
import {
  createStaffUserSchema,
  deleteStaffUserSchema,
  type CreateStaffUserInput,
  type DeleteStaffUserInput,
} from "../schemas/staff-user-schema"

export async function linkUserToStaffAction(values: CreateStaffUserInput) {
  try {
    const validatedFields = createStaffUserSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid data." }
    }

    const staffUser = await StaffUserService.linkUserToStaff(validatedFields.data)
    revalidatePath("/admin/staff")
    return { success: true, data: staffUser }
  } catch (error) {
    console.error("Failed to link user to staff:", error)
    return { error: "Failed to link user to staff." }
  }
}

export async function unlinkUserFromStaffAction(values: DeleteStaffUserInput) {
  try {
    const validatedFields = deleteStaffUserSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid data." }
    }

    await StaffUserService.unlinkUserFromStaff(validatedFields.data)
    revalidatePath("/admin/staff")
    return { success: true }
  } catch (error) {
    console.error("Failed to unlink user from staff:", error)
    return { error: "Failed to unlink user from staff." }
  }
}
