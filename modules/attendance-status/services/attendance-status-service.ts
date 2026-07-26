import { AttendanceStatusRepository } from "../repositories/attendance-status-repository"
import { AttendanceStatusInput } from "../schemas/attendance-status"

export class AttendanceStatusService {
  static async create(data: AttendanceStatusInput) {
    const existing = await AttendanceStatusRepository.findByCode(data.code)
    if (existing) {
      throw new Error(`Status dengan kode ${data.code} sudah ada.`)
    }
    return await AttendanceStatusRepository.create(data)
  }

  static async update(id: string, data: AttendanceStatusInput) {
    const existing = await AttendanceStatusRepository.findByCode(data.code)
    if (existing && existing.id !== id) {
      throw new Error(`Status dengan kode ${data.code} sudah ada.`)
    }
    return await AttendanceStatusRepository.update(id, data)
  }

  static async delete(id: string) {
    return await AttendanceStatusRepository.delete(id)
  }

  static async getAll() {
    return await AttendanceStatusRepository.findAll()
  }
}
