import { z } from "zod";

export const attendanceWorkingHourSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  workingHourId: z.string().min(1, "Working Hour ID is required"),
  attendanceDate: z.coerce.date({ error: "Attendance date is required" }),
});

export type AttendanceWorkingHourInput = z.infer<typeof attendanceWorkingHourSchema>;

// Schema for bulk assignment
export const bulkAttendanceWorkingHourSchema = z.object({
  staffIds: z.array(z.string().min(1, "Staff ID is required")).min(1, "At least one staff member must be selected"),
  workingHourId: z.string().min(1, "Working Hour ID is required"),
  startDate: z.coerce.date({ error: "Start date is required" }),
  endDate: z.coerce.date({ error: "End date is required" }),
});

export type BulkAttendanceWorkingHourInput = z.infer<typeof bulkAttendanceWorkingHourSchema>;
