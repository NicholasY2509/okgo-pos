"use server"

import { revalidatePath } from "next/cache"
import { StaffService } from "../services/staff-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"
import {
  createStaffSchema,
  updateStaffSchema,
  type CreateStaffInput,
  type UpdateStaffInput,
} from "../schemas/staff-schema"

// --- Staff Actions ---

export async function getStaffListAction(branchId?: string, serviceId?: string, excludeSessionId?: string, startTime?: Date) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const staff = await StaffService.getAllStaff(branchId, serviceId, excludeSessionId, startTime)
    return { success: true, data: staff }
  } catch (error: unknown) {
    console.error("Failed to fetch staff list:", error)
    return { error: "Gagal mengambil data staf." }
  }
}

export async function createStaffAction(values: CreateStaffInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = createStaffSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const staff = await StaffService.createStaff(validatedFields.data)
    revalidatePath("/admin/staff")
    return { success: true, data: staff }
  } catch (error: unknown) {
    console.error("Failed to create staff:", error)
    return { error: "Gagal membuat staf." }
  }
}

export async function updateStaffAction(values: UpdateStaffInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = updateStaffSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const { id, ...data } = validatedFields.data
    const staff = await StaffService.updateStaff(id, data)
    revalidatePath("/admin/staff")
    return { success: true, data: staff }
  } catch (error: unknown) {
    console.error("Failed to update staff:", error)
    return { error: "Gagal memperbarui staf." }
  }
}

export async function deleteStaffAction(id: string) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    await StaffService.deleteStaff(id)
    revalidatePath("/admin/staff")
    return { success: true }
  } catch (error: unknown) {
    console.error("Failed to delete staff:", error)
    return { error: "Gagal menghapus staf." }
  }
}

export async function getMatchingStaffIdsAction(params: { search?: string; branchId?: string } = {}) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const staffIds = await StaffService.getMatchingStaffIds(params)
    return { success: true, data: staffIds }
  } catch (error: unknown) {
    console.error("Failed to fetch matching staff ids:", error)
    return { error: "Gagal mengambil data id staf." }
  }
}

export async function getBranchHrisRosterAction(branchId: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const roster = await StaffService.getBranchHrisRoster(branchId)
    return { success: true, data: roster }
  } catch (error: unknown) {
    console.error("Failed to fetch branch HRIS roster:", error)
    return { error: "Gagal mengambil data roster karyawan cabang." }
  }
}

