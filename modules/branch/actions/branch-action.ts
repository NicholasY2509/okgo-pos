"use server"

import { revalidatePath } from "next/cache"
import { BranchService } from "../services/branch-service"
import { createBranchSchema, assignStaffBranchSchema, updateBranchSchema, type CreateBranchInput, type AssignStaffBranchInput, type UpdateBranchInput } from "../schemas/branch-schema"

export async function createBranchAction(values: CreateBranchInput) {
  try {
    const validatedFields = createBranchSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data cabang tidak valid." }
    }

    const branch = await BranchService.createBranch(validatedFields.data)

    revalidatePath("/admin/branches")

    return { success: true, data: branch }
  } catch (error) {
    console.error("Failed to create branch:", error)
    return { error: "Gagal membuat cabang." }
  }
}

export async function updateBranchAction(values: UpdateBranchInput) {
  try {
    const validatedFields = updateBranchSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data cabang tidak valid." }
    }

    const { id, ...data } = validatedFields.data
    const branch = await BranchService.updateBranch(id, data)

    revalidatePath("/admin/branches")

    return { success: true, data: branch }
  } catch (error) {
    console.error("Failed to update branch:", error)
    return { error: "Gagal memperbarui cabang." }
  }
}

export async function assignStaffToBranchAction(values: AssignStaffBranchInput) {
  try {
    const validatedFields = assignStaffBranchSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data penugasan tidak valid." }
    }

    const branchStaff = await BranchService.assignStaffToBranch(validatedFields.data)

    revalidatePath(`/admin/branches/${validatedFields.data.branchId}/settings`)

    return { success: true, data: branchStaff }
  } catch (error) {
    console.error("Failed to assign staff:", error)
    return { error: "Gagal menugaskan staf ke cabang." }
  }
}

export async function removeBranchStaffAction(branchStaffId: string, branchId: string) {
  try {
    if (!branchStaffId) {
      return { error: "ID penugasan tidak valid." }
    }

    await BranchService.removeBranchStaff(branchStaffId)

    revalidatePath(`/admin/branches/${branchId}/settings`)

    return { success: true }
  } catch (error) {
    console.error("Failed to remove staff:", error)
    return { error: "Gagal menghapus penugasan staf dari cabang." }
  }
}
