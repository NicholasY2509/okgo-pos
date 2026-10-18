"use server";

import { StaffIncentiveService } from "../services/staff-incentive-service";
import { GetIncentivesFilter, GetIncentiveDetailsFilter } from "../repositories/staff-incentive-repository";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function getIncentivesAction(filter: GetIncentivesFilter) {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { success: false, error: authCheck.error };
    }

    const result = await StaffIncentiveService.getIncentives(filter);
    return { success: true, data: result.data, pagination: result.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

export async function getIncentiveSummaryAction(filter: Omit<GetIncentivesFilter, "page" | "limit">) {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { success: false, error: authCheck.error };
    }

    const result = await StaffIncentiveService.getIncentiveSummary(filter);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

export async function getStaffIncentiveDetailsAction(filter: GetIncentiveDetailsFilter) {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { success: false, error: authCheck.error };
    }

    const result = await StaffIncentiveService.getStaffIncentiveDetails(filter);
    return { success: true, data: result.data, pagination: result.pagination };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}
