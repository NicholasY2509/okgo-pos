"use server";

import { staffOnboardingSchema, type StaffOnboardingInput } from "../schemas/staff-onboarding-schema";
import { StaffOnboardingService } from "../services/staff-onboarding-service";

export async function onboardStaffAction(values: StaffOnboardingInput) {
  try {
    // 1. Validate Input (Never trust the client)
    const validatedFields = staffOnboardingSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    // 2. Execute Service
    const result = await StaffOnboardingService.onboardStaff(validatedFields.data);
    
    // 3. Return Success
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Failed to onboard staff:", error);
    return { error: error?.message || "An unexpected error occurred." };
  }
}
