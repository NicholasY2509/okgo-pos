"use server"

import { revalidatePath } from "next/cache"
import { UserService } from "../services/user-service"
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "../schemas/user-schema"
import { Prisma } from "@/lib/generated/prisma"

export async function createUserAction(values: CreateUserInput) {
  try {
    const validatedFields = createUserSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid user data." }
    }

    const user = await UserService.createUser(validatedFields.data)
    revalidatePath("/admin/users")
    
    return { success: true, data: user }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: "Email already exists." }
    }
    console.error("Failed to create user:", error)
    return { error: "Failed to create user." }
  }
}

export async function updateUserAction(values: UpdateUserInput) {
  try {
    const validatedFields = updateUserSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid user data." }
    }

    const { id, ...data } = validatedFields.data
    const user = await UserService.updateUser(id, data)
    
    revalidatePath("/admin/users")
    
    return { success: true, data: user }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: "Email already exists." }
    }
    console.error("Failed to update user:", error)
    return { error: "Failed to update user." }
  }
}

export async function deleteUserAction(id: string) {
  try {
    await UserService.deleteUser(id)
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete user:", error)
    return { error: "Failed to delete user." }
  }
}
