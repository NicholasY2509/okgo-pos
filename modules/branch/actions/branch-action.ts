"use server"

import { revalidatePath } from "next/cache"
import { BranchService } from "../services/branch-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"
import {
  createBranchSchema,
  assignStaffBranchSchema,
  updateBranchSchema,
  bulkAssignStaffSchema,
  transferBranchStaffSchema,
  bulkTransferStaffSchema,
  type CreateBranchInput,
  type AssignStaffBranchInput,
  type UpdateBranchInput,
  type BulkAssignStaffInput,
  type TransferBranchStaffInput,
  type BulkTransferStaffInput,
} from "../schemas/branch-schema"

export async function createBranchAction(values: CreateBranchInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = createBranchSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data cabang tidak valid." }
    }

    const branch = await BranchService.createBranch(validatedFields.data)

    revalidatePath("/admin/branches")

    return { success: true, data: branch }
  } catch (error: unknown) {
    console.error("Failed to create branch:", error)
    return { error: "Gagal membuat cabang." }
  }
}

export async function updateBranchAction(values: UpdateBranchInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = updateBranchSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data cabang tidak valid." }
    }

    const { id, ...data } = validatedFields.data
    const branch = await BranchService.updateBranch(id, data)

    revalidatePath("/admin/branches")

    return { success: true, data: branch }
  } catch (error: unknown) {
    console.error("Failed to update branch:", error)
    return { error: "Gagal memperbarui cabang." }
  }
}

export async function assignStaffToBranchAction(values: AssignStaffBranchInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = assignStaffBranchSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data penugasan tidak valid." }
    }

    const branchStaff = await BranchService.assignStaffToBranch(validatedFields.data)

    revalidatePath("/admin/branches")
    revalidatePath("/admin/staff")
    if (validatedFields.data.staffId) {
      revalidatePath(`/admin/staff/${validatedFields.data.staffId}`)
    }

    return { success: true, data: branchStaff }
  } catch (error: unknown) {
    console.error("Failed to assign staff:", error)
    return { error: "Gagal menugaskan staf ke cabang." }
  }
}

export async function bulkAssignStaffAction(values: BulkAssignStaffInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = bulkAssignStaffSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data penugasan massal tidak valid." }
    }

    const result = await BranchService.bulkAssignStaff(validatedFields.data)

    revalidatePath("/admin/branches")
    revalidatePath("/admin/staff")
    for (const staffId of validatedFields.data.staffIds) {
      revalidatePath(`/admin/staff/${staffId}`)
    }

    return { success: true, data: result }
  } catch (error: unknown) {
    console.error("Failed to bulk assign staff:", error)
    return { error: "Gagal menugaskan staf secara massal." }
  }
}

export async function transferBranchStaffAction(values: TransferBranchStaffInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = transferBranchStaffSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data pemindahan staf tidak valid." }
    }

    const result = await BranchService.transferBranchStaff(validatedFields.data)

    revalidatePath("/admin/branches")
    revalidatePath("/admin/staff")
    if (validatedFields.data.staffId) {
      revalidatePath(`/admin/staff/${validatedFields.data.staffId}`)
    }

    return { success: true, data: result }
  } catch (error: unknown) {
    console.error("Failed to transfer staff:", error)
    return { error: "Gagal memindahkan staf ke cabang baru." }
  }
}

export async function bulkTransferStaffAction(values: BulkTransferStaffInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = bulkTransferStaffSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data pemindahan massal tidak valid." }
    }

    const result = await BranchService.bulkTransferStaff(validatedFields.data)

    revalidatePath("/admin/branches")
    revalidatePath("/admin/staff")
    for (const staffId of validatedFields.data.staffIds) {
      revalidatePath(`/admin/staff/${staffId}`)
    }

    return { success: true, data: result }
  } catch (error: unknown) {
    console.error("Failed to bulk transfer staff:", error)
    return { error: "Gagal memindahkan staf secara massal." }
  }
}

export async function removeBranchStaffAction(branchStaffId: string, branchId?: string, staffId?: string) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    if (!branchStaffId) {
      return { error: "ID penugasan tidak valid." }
    }

    await BranchService.removeBranchStaff(branchStaffId)

    revalidatePath("/admin/branches")
    revalidatePath("/admin/staff")
    if (staffId) {
      revalidatePath(`/admin/staff/${staffId}`)
    }

    return { success: true }
  } catch (error: unknown) {
    console.error("Failed to remove staff:", error)
    return { error: "Gagal menghapus penugasan staf dari cabang." }
  }
}

