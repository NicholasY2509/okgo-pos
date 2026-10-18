"use server"

import { revalidatePath } from "next/cache"
import { WorkPositionService } from "../services/work-position-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"
import {
  createWorkPositionSchema,
  updateWorkPositionSchema,
  type CreateWorkPositionInput,
  type UpdateWorkPositionInput,
} from "../schemas/work-position-schema"

export async function createWorkPositionAction(values: CreateWorkPositionInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = createWorkPositionSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const position = await WorkPositionService.createWorkPosition(validatedFields.data)
    revalidatePath("/admin/staff/work-positions")
    return { success: true, data: position }
  } catch (error: unknown) {
    console.error("Failed to create work position:", error)
    return { error: "Gagal membuat posisi kerja." }
  }
}

export async function updateWorkPositionAction(values: UpdateWorkPositionInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = updateWorkPositionSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const { id, ...data } = validatedFields.data
    const position = await WorkPositionService.updateWorkPosition(id, data)
    revalidatePath("/admin/staff/work-positions")
    return { success: true, data: position }
  } catch (error: unknown) {
    console.error("Failed to update work position:", error)
    return { error: "Gagal memperbarui posisi kerja." }
  }
}

export async function deleteWorkPositionAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    await WorkPositionService.deleteWorkPosition(id)
    revalidatePath("/admin/staff/work-positions")
    return { success: true }
  } catch (error: unknown) {
    console.error("Failed to delete work position:", error)
    return { error: "Gagal menghapus posisi kerja." }
  }
}
