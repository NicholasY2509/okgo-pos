import bcrypt from "bcryptjs";
import { StaffOnboardingRepository } from "../repositories/staff-onboarding-repository";
import { StaffOnboardingInput } from "../schemas/staff-onboarding-schema";
import { StaffRepository } from "../repositories/staff-repository";

export class StaffOnboardingService {
  static async onboardStaff(data: StaffOnboardingInput) {
    let hashedPassword = undefined;

    // 1. If creating a user account, check if the email is already in use and hash the password
    if (data.createUserAccount && data.email) {
      const existingUser = await StaffOnboardingRepository.findUserByEmail(data.email);
      if (existingUser) {
        throw new Error("Email is already in use.");
      }

      if (data.password) {
        hashedPassword = await bcrypt.hash(data.password, 10);
      }
    }

    // 2. Auto-generate staffIdNumber
    let staffIdNumber = data.staffIdNumber;
    if (!staffIdNumber) {
      const lastStaff = await StaffRepository.getLastStaffIdNumber();
      let nextNumber = 1;
      if (lastStaff?.staffIdNumber) {
        const lastNumberStr = lastStaff.staffIdNumber.replace("STF-", "");
        const lastNumber = parseInt(lastNumberStr, 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      staffIdNumber = `STF-${String(nextNumber).padStart(3, "0")}`;
    }

    // 3. Delegate to Repository to create the records atomically
    const result = await StaffOnboardingRepository.onboardUser({
      ...data,
      staffIdNumber,
      hashedPassword,
    });

    return result;
  }
}
