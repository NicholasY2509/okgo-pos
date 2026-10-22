"use server"

import { revalidatePath } from "next/cache"
import { RoleService } from "../services/role-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"
import { Prisma } from "@/lib/generated/prisma"
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
} from "../schemas/role-schema"

export async function getRolesAction() {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const roles = await RoleService.getAllRoles()
    return { success: true, data: roles }
  } catch (error: unknown) {
    console.error("Failed to get roles:", error)
    return { error: "Gagal mengambil role." }
  }
}

export async function createRoleAction(values: CreateRoleInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = createRoleSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const role = await RoleService.createRole(validatedFields.data)
    revalidatePath("/admin/roles")
    return { success: true, data: role }
  } catch (error: unknown) {
    console.error("Failed to create role:", error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: "Nama Role sudah digunakan." }
    }
    return { error: "Gagal membuat role." }
  }
}

export async function updateRoleAction(values: UpdateRoleInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = updateRoleSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data tidak valid." }
    }

    const { id, ...data } = validatedFields.data
    const role = await RoleService.updateRole(id, data)
    revalidatePath("/admin/roles")
    return { success: true, data: role }
  } catch (error: unknown) {
    console.error("Failed to update role:", error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: "Nama Role sudah digunakan." }
    }
    return { error: "Gagal memperbarui role." }
  }
}

export async function deleteRoleAction(id: string) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    await RoleService.deleteRole(id)
    revalidatePath("/admin/roles")
    return { success: true }
  } catch (error: unknown) {
    console.error("Failed to delete role:", error)
    return { error: "Gagal menghapus role." }
  }
}
