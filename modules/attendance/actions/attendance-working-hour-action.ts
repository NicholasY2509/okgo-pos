"use server";

import { revalidatePath } from "next/cache";
import { bulkAttendanceWorkingHourSchema, type BulkAttendanceWorkingHourInput } from "../schemas/attendance-working-hour";
import { AttendanceWorkingHourService } from "../services/attendance-working-hour-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function assignBulkAttendanceWorkingHourAction(values: BulkAttendanceWorkingHourInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = bulkAttendanceWorkingHourSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const result = await AttendanceWorkingHourService.bulkAssignSchedules(validatedFields.data);
    revalidatePath("/admin/attendance");
    revalidatePath("/[tenant]/hris/attendance", "page");
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Failed to assign schedule:", error);
    return { error: "An unexpected error occurred while assigning schedule." };
  }
}

export async function deleteAttendanceWorkingHourAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    await AttendanceWorkingHourService.deleteSchedule(id);
    revalidatePath("/admin/attendance/schedules");
    revalidatePath("/[tenant]/hris/attendance", "page");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete schedule:", error);
    return { error: "Failed to delete schedule assignment." };
  }
}
