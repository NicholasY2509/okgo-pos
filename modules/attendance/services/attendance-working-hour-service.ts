import { AttendanceWorkingHourRepository } from "../repositories/attendance-working-hour-repository";
import type { AttendanceWorkingHourInput, BulkAttendanceWorkingHourInput } from "../schemas/attendance-working-hour";

export class AttendanceWorkingHourService {
  static async getByStaffId(staffId: string, startDate?: Date, endDate?: Date) {
    return await AttendanceWorkingHourRepository.findManyByStaffId(staffId, startDate, endDate);
  }

  static async assignSchedule(data: AttendanceWorkingHourInput) {
    return await AttendanceWorkingHourRepository.upsert(data);
  }

  static async bulkAssignSchedules(data: BulkAttendanceWorkingHourInput) {
    // Generate an array of dates between startDate and endDate inclusive
    const dates: Date[] = [];
    let currentDate = new Date(data.startDate);
    const end = new Date(data.endDate);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const results = [];
    
    // Iterate through staff and dates to upsert schedules
    // Note: for production, this should ideally be a single Prisma transaction or createMany,
    // but Prisma doesn't natively support upsertMany yet.
    for (const staffId of data.staffIds) {
      for (const date of dates) {
        const result = await AttendanceWorkingHourRepository.upsert({
          staffId,
          workingHourId: data.workingHourId,
          attendanceDate: date,
        });
        results.push(result);
      }
    }

    return results;
  }
  static async getAllPaginated(params: { page: number; limit: number; search?: string }) {
    const { page, limit } = params;
    const { data, total } = await AttendanceWorkingHourRepository.findManyPaginated(params);
    const totalPages = Math.ceil(total / limit);

    return {
      schedules: data,
      metadata: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}

