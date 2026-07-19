"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from "date-fns";

export async function getExportTemplateDataAction() {
  try {
    const activeStaff = await prisma.staff.findMany({
      where: { isActive: true },
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        staffIdNumber: true,
      }
    });

    const workingHours = await prisma.workingHour.findMany({
      orderBy: { name: "asc" },
    });

    return { success: true, data: { activeStaff, workingHours } };
  } catch (error) {
    console.error(error);
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
    if (records.length === 0) return { error: "No records to process." };

    // Fetch all shifts to map code to ID
    const shifts = await prisma.workingHour.findMany();
    const shiftMap = new Map(shifts.map(s => [s.code.toLowerCase(), s.id]));

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
      const dates = Array.from(dateStaffMap.keys()).map(d => new Date(d));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      const allStaffIds = Array.from(new Set(records.map(r => r.staffId)));

      const existingRecords = await prisma.attendanceWorkingHour.findFirst({
        where: {
          attendanceDate: {
            gte: minDate,
            lte: maxDate
          },
          staffId: { in: allStaffIds }
        }
      });

      if (existingRecords) {
        return { 
          requiresConfirmation: true, 
          message: "Existing schedules found for the selected dates. Do you want to replace them?" 
        };
      }
    }

    // Proceed to insert/replace
    await prisma.$transaction(async (tx) => {
      // First delete overlapping records
      for (const [dateStr, staffSet] of dateStaffMap.entries()) {
        await tx.attendanceWorkingHour.deleteMany({
          where: {
            attendanceDate: new Date(dateStr),
            staffId: { in: Array.from(staffSet) }
          }
        });
      }

      // Bulk insert
      await tx.attendanceWorkingHour.createMany({
        data: validRecords
      });
    });

    revalidatePath("/admin/attendance/schedules");
    return { success: true, count: validRecords.length };

  } catch (error) {
    console.error("Import error:", error);
    return { error: "Failed to process imported schedules." };
  }
}
