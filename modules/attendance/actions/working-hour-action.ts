"use server";

import { revalidatePath } from "next/cache";
import { workingHourSchema, type WorkingHourInput } from "../schemas/working-hour";
import { WorkingHourService } from "../services/working-hour-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";
import { Prisma } from "@/lib/generated/prisma";

export async function createWorkingHourAction(values: WorkingHourInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = workingHourSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const result = await WorkingHourService.create(validatedFields.data);
    revalidatePath("/admin/attendance");
    revalidatePath("/[tenant]/hris/attendance", "page");
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Failed to create working hour:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A shift with this code already exists. Please use a unique code." };
    }
    return { error: "An unexpected error occurred while creating working hour." };
  }
}

export async function updateWorkingHourAction(id: string, values: WorkingHourInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = workingHourSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const result = await WorkingHourService.update(id, validatedFields.data);
    revalidatePath("/admin/attendance/working-hours");
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Failed to update working hour:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A shift with this code already exists. Please use a unique code." };
    }
    return { error: "An unexpected error occurred while updating working hour." };
  }
}

export async function deleteWorkingHourAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    await WorkingHourService.delete(id);
    revalidatePath("/admin/attendance/working-hours");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete working hour:", error);
    return { error: "Failed to delete working hour template." };
  }
}

export async function getWorkingHourListAction() {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const list = await WorkingHourService.getAll();
    return { data: list };
  } catch (error: unknown) {
    console.error("Failed to get working hours:", error);
    return { error: "Failed to retrieve working hour list." };
  }
}
