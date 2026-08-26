import { StaffSalaryRepository } from "../repositories/staff-salary-repository"
import { StaffSalaryInput } from "../schemas/staff-salary-schema"

export class StaffSalaryService {
  static async create(data: StaffSalaryInput) {
    return await StaffSalaryRepository.create(data)
  }

  static async update(id: string, data: StaffSalaryInput) {
    return await StaffSalaryRepository.update(id, data)
  }

  static async delete(id: string) {
    return await StaffSalaryRepository.delete(id)
  }

  static async getAllStaffWithSalaries() {
    return await StaffSalaryRepository.getAllStaffWithSalaries()
  }

  static async getStaffSalaryHistory(staffId: string) {
    return await StaffSalaryRepository.getStaffSalaryHistory(staffId)
  }
}
