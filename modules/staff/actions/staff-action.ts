"use server"

import { revalidatePath } from "next/cache"
import { StaffService } from "../services/staff-service"
import {
  createStaffSchema,
  updateStaffSchema,
  type CreateStaffInput,
  type UpdateStaffInput,
} from "../schemas/staff-schema"

// --- Staff Actions ---

export async function createStaffAction(values: CreateStaffInput) {
  try {
    const validatedFields = createStaffSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const staff = await StaffService.createStaff(validatedFields.data)
    revalidatePath("/admin/staff")
    return { success: true, data: staff }
  } catch (error) {
    console.error("Failed to create staff:", error)
    return { error: "Gagal membuat staf." }
  }
}

export async function updateStaffAction(values: UpdateStaffInput) {
  try {
    const validatedFields = updateStaffSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const { id, ...data } = validatedFields.data
    const staff = await StaffService.updateStaff(id, data)
    revalidatePath("/admin/staff")
    return { success: true, data: staff }
  } catch (error) {
    console.error("Failed to update staff:", error)
    return { error: "Gagal memperbarui staf." }
  }
}

export async function deleteStaffAction(id: string) {
  try {
    await StaffService.deleteStaff(id)
    revalidatePath("/admin/staff")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete staff:", error)
    return { error: "Gagal menghapus staf." }
  }
}
