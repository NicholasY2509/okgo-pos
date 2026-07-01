import {
  CreateStaffInput,
  UpdateStaffInput,
} from "../schemas/staff-schema"
import { StaffRepository } from "../repositories/staff-repository"

export class StaffService {
  // --- Staff ---

  static async getAllStaff(branchId?: string) {
    return await StaffRepository.getAllStaff(branchId)
  }

  static async getActiveStaff(branchId: string) {
    return await StaffRepository.getActiveStaff(branchId)
  }

  static async getStaffById(id: string) {
    return await StaffRepository.getStaffById(id)
  }

  static async createStaff(data: CreateStaffInput) {
    return await StaffRepository.createStaff(data)
  }

  static async updateStaff(id: string, data: Omit<UpdateStaffInput, "id">) {
    return await StaffRepository.updateStaff(id, data)
  }

  static async deleteStaff(id: string) {
    return await StaffRepository.deleteStaff(id)
  }
}
