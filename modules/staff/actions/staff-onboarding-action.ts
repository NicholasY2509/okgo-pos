"use server";

import { staffOnboardingSchema, type StaffOnboardingInput } from "../schemas/staff-onboarding-schema";
import { StaffOnboardingService } from "../services/staff-onboarding-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function onboardStaffAction(values: StaffOnboardingInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = staffOnboardingSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const result = await StaffOnboardingService.onboardStaff(validatedFields.data);
    
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Failed to onboard staff:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}
