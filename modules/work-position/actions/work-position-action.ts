"use server"

import { revalidatePath } from "next/cache"
import { WorkPositionService } from "../services/work-position-service"
import {
  createWorkPositionSchema,
  updateWorkPositionSchema,
  type CreateWorkPositionInput,
  type UpdateWorkPositionInput,
} from "../schemas/work-position-schema"

export async function createWorkPositionAction(values: CreateWorkPositionInput) {
  try {
    const validatedFields = createWorkPositionSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid data." }
    }

    const position = await WorkPositionService.createWorkPosition(validatedFields.data)
    revalidatePath("/admin/staff/work-positions")
    return { success: true, data: position }
  } catch (error) {
    console.error("Failed to create work position:", error)
    return { error: "Failed to create work position." }
  }
}

export async function updateWorkPositionAction(values: UpdateWorkPositionInput) {
  try {
    const validatedFields = updateWorkPositionSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid data." }
    }

    const { id, ...data } = validatedFields.data
    const position = await WorkPositionService.updateWorkPosition(id, data)
    revalidatePath("/admin/staff/work-positions")
    return { success: true, data: position }
  } catch (error) {
    console.error("Failed to update work position:", error)
    return { error: "Failed to update work position." }
  }
}

export async function deleteWorkPositionAction(id: string) {
  try {
    await WorkPositionService.deleteWorkPosition(id)
    revalidatePath("/admin/staff/work-positions")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete work position:", error)
    return { error: "Failed to delete work position." }
  }
}
