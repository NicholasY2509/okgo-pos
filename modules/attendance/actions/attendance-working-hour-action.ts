"use server";

import { revalidatePath } from "next/cache";
import { bulkAttendanceWorkingHourSchema, type BulkAttendanceWorkingHourInput } from "../schemas/attendance-working-hour";
import { AttendanceWorkingHourService } from "../services/attendance-working-hour-service";

export async function assignBulkAttendanceWorkingHourAction(values: BulkAttendanceWorkingHourInput) {
  try {
    const validatedFields = bulkAttendanceWorkingHourSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const result = await AttendanceWorkingHourService.bulkAssignSchedules(validatedFields.data);
    revalidatePath("/admin/attendance");
    revalidatePath("/[tenant]/hris/attendance", "page");
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred while assigning schedule." };
  }
}

export async function deleteAttendanceWorkingHourAction(id: string) {
  try {
    const { AttendanceWorkingHourRepository } = await import("../repositories/attendance-working-hour-repository");
    await AttendanceWorkingHourRepository.delete(id);
    revalidatePath("/admin/attendance/schedules");
    revalidatePath("/[tenant]/hris/attendance", "page");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete schedule assignment." };
  }
}
