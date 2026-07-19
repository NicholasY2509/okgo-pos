"use server";

import { revalidatePath } from "next/cache";
import { workingHourSchema, type WorkingHourInput } from "../schemas/working-hour";
import { WorkingHourService } from "../services/working-hour-service";

export async function createWorkingHourAction(values: WorkingHourInput) {
  try {
    const validatedFields = workingHourSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const result = await WorkingHourService.create(validatedFields.data);
    revalidatePath("/admin/attendance");
    revalidatePath("/[tenant]/hris/attendance", "page");
    return { success: true, data: result };
  } catch (error: any) {
    console.error(error);
    if (error?.code === "P2002") {
      return { error: "A shift with this code already exists. Please use a unique code." };
    }
    return { error: "An unexpected error occurred while creating working hour." };
  }
}

export async function updateWorkingHourAction(id: string, values: WorkingHourInput) {
  try {
    const validatedFields = workingHourSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const result = await WorkingHourService.update(id, validatedFields.data);
    revalidatePath("/admin/attendance/working-hours");
    return { success: true, data: result };
  } catch (error: any) {
    console.error(error);
    if (error?.code === "P2002") {
      return { error: "A shift with this code already exists. Please use a unique code." };
    }
    return { error: "An unexpected error occurred while updating working hour." };
  }
}

export async function deleteWorkingHourAction(id: string) {
  try {
    await WorkingHourService.delete(id);
    revalidatePath("/admin/attendance/working-hours");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete working hour template." };
  }
}

export async function getWorkingHourListAction() {
  try {
    const list = await WorkingHourService.getAll();
    return { data: list };
  } catch (error) {
    console.error(error);
    return { error: "Failed to load working hours." };
  }
}
