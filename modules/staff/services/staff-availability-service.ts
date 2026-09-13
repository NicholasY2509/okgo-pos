import { prisma } from "@/lib/prisma";
import { addMinutes } from "date-fns";

export class StaffAvailabilityService {
  /**
   * Helper function to determine which staff IDs are busy based on a list of sessions
   * and a specific time slot. This is useful for bulk calculations to avoid N+1 queries.
   */
  static getBusyStaffIds(sessions: any[], startTime: Date, endTime: Date): Set<string> {
    const busyStaffIds = new Set<string>();

    for (const session of sessions) {
      if (!session.startTime) continue;
      const sessionStart = session.startTime;
      const sessionEnd = session.endTime || addMinutes(sessionStart, 60);

      // Check if the session overlaps with the requested time slot
      if (startTime < sessionEnd && endTime > sessionStart && session.staffId) {
        busyStaffIds.add(session.staffId);
      }
    }

    return busyStaffIds;
  }

  /**
   * Fetches the available staff for a specific time slot.
   * Can accept an optional Prisma transaction client (`tx`) to run within an existing transaction.
   */
  static async getAvailableStaff(
    branchId: string,
    startTime: Date,
    endTime: Date,
    tx: any = prisma
  ) {
    // Fetch all active staff for the branch
    const staffList = await tx.staff.findMany({
      where: {
        branchStaffs: { some: { branchId } },
        isActive: true,
      },
    });

    // Fetch all sessions that might overlap with this time slot
    // We fetch sessions that are SCHEDULED or IN_PROGRESS and start before our endTime
    const existingSessions = await tx.serviceSession.findMany({
      where: {
        branchId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        startTime: {
          lte: endTime,
        },
      },
    });

    const busyStaffIds = this.getBusyStaffIds(existingSessions, startTime, endTime);

    // Return only staff that are not busy
    return staffList.filter((s: any) => !busyStaffIds.has(s.id));
  }
}
