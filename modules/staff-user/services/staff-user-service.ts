import { CreateStaffUserInput, DeleteStaffUserInput } from "../schemas/staff-user-schema"
import { StaffUserRepository } from "../repositories/staff-user-repository"

export class StaffUserService {
  static async getStaffUsersByStaffId(staffId: string) {
    return await StaffUserRepository.getStaffUsersByStaffId(staffId)
  }

  static async linkUserToStaff(data: CreateStaffUserInput) {
    return await StaffUserRepository.linkUserToStaff(data)
  }

  static async unlinkUserFromStaff(data: DeleteStaffUserInput) {
    return await StaffUserRepository.unlinkUserFromStaff(data)
  }
}
