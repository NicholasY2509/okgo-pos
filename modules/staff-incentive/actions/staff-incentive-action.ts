"use server";

import { StaffIncentiveService } from "../services/staff-incentive-service";
import { GetIncentivesFilter } from "../repositories/staff-incentive-repository";

export async function getIncentivesAction(filter: GetIncentivesFilter) {
  try {
    const result = await StaffIncentiveService.getIncentives(filter);
    return { success: true, data: result.data, pagination: result.pagination };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
