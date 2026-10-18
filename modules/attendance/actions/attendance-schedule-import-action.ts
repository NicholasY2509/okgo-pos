"use server";

import { revalidatePath } from "next/cache";
import { StaffService } from "@/modules/staff/services/staff-service";
import { WorkingHourService } from "../services/working-hour-service";
import { AttendanceWorkingHourService } from "../services/attendance-working-hour-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function getExportTemplateDataAction() {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const [activeStaff, workingHours] = await Promise.all([
      StaffService.getActiveStaffForExport(),
      WorkingHourService.getAll(),
    ]);

    return { success: true, data: { activeStaff, workingHours } };
  } catch (error) {
    console.error("Failed to load export template data:", error);
    return { error: "Failed to load data for export." };
  }
}

export type ScheduleImportPayload = {
  staffId: string;
  date: string; // YYYY-MM-DD
  shiftCode: string;
};

export async function processScheduleImportAction(
  records: ScheduleImportPayload[],
  confirmReplace: boolean = false
) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    if (records.length === 0) return { error: "No records to process." };

    // Fetch all shifts to map code to ID
    const shifts = await WorkingHourService.getAll();
    const shiftMap = new Map(shifts.map((s) => [s.code.toLowerCase(), s.id]));

    const validRecords: { staffId: string; attendanceDate: Date; workingHourId: string }[] = [];

    // Dates to check for existing
    const dateStaffMap = new Map<string, Set<string>>();

    for (const record of records) {
      if (!record.shiftCode) continue;

      const workingHourId = shiftMap.get(record.shiftCode.toLowerCase().trim());
      if (!workingHourId) {
        return { error: `Invalid shift code found: ${record.shiftCode}` };
      }

      const dateObj = new Date(record.date);
      validRecords.push({
        staffId: record.staffId,
        attendanceDate: dateObj,
        workingHourId,
      });

      if (!dateStaffMap.has(record.date)) {
        dateStaffMap.set(record.date, new Set());
      }
      dateStaffMap.get(record.date)!.add(record.staffId);
    }

    if (validRecords.length === 0) {
      return { error: "No valid schedule records found to import." };
    }

    // Check for existing records
    if (!confirmReplace) {
      const dates = Array.from(dateStaffMap.keys()).map((d) => new Date(d));
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
      const allStaffIds = Array.from(new Set(records.map((r) => r.staffId)));

      const existingRecord = await AttendanceWorkingHourService.checkExistingSchedules(
        minDate,
        maxDate,
        allStaffIds
      );

      if (existingRecord) {
        return {
          requiresConfirmation: true,
          message:
            "Existing schedules found for the selected dates. Do you want to replace them?",
        };
      }
    }

    // Proceed to insert/replace via service and repository
    const dateStaffEntries: [string, string[]][] = Array.from(dateStaffMap.entries()).map(
      ([dateStr, staffSet]) => [dateStr, Array.from(staffSet)]
    );

    await AttendanceWorkingHourService.replaceSchedules(dateStaffEntries, validRecords);

    revalidatePath("/admin/attendance/schedules");
    return { success: true, count: validRecords.length };
  } catch (error) {
    console.error("Import error:", error);
    return { error: "Failed to process imported schedules." };
  }
}
