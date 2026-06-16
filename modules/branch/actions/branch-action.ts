"use server"

import { revalidatePath } from "next/cache"
import { BranchService } from "../services/branch-service"
import { createBranchSchema, assignUserBranchSchema, updateBranchSchema, type CreateBranchInput, type AssignUserBranchInput, type UpdateBranchInput } from "../schemas/branch-schema"

export async function createBranchAction(values: CreateBranchInput) {
  try {
    const validatedFields = createBranchSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid branch data." }
    }

    const branch = await BranchService.createBranch(validatedFields.data)

    revalidatePath("/admin/branches")

    return { success: true, data: branch }
  } catch (error) {
    console.error("Failed to create branch:", error)
    return { error: "Failed to create branch." }
  }
}

export async function updateBranchAction(values: UpdateBranchInput) {
  try {
    const validatedFields = updateBranchSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid branch data." }
    }

    const { id, ...data } = validatedFields.data
    const branch = await BranchService.updateBranch(id, data)

    revalidatePath("/admin/branches")

    return { success: true, data: branch }
  } catch (error) {
    console.error("Failed to update branch:", error)
    return { error: "Failed to update branch." }
  }
}

export async function assignUserToBranchAction(values: AssignUserBranchInput) {
  try {
    const validatedFields = assignUserBranchSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid assignment data." }
    }

    const branchUser = await BranchService.assignUserToBranch(validatedFields.data)

    revalidatePath(`/admin/branches/${validatedFields.data.branchId}/settings`)

    return { success: true, data: branchUser }
  } catch (error) {
    console.error("Failed to assign user:", error)
    return { error: "Failed to assign user to branch." }
  }
}
