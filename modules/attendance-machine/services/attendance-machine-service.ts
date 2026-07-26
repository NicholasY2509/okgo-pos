import { AttendanceMachineRepository } from "../repositories/attendance-machine-repository"
import { AttendanceMachineInput } from "../schemas/attendance-machine"

export class AttendanceMachineService {
  static async create(data: AttendanceMachineInput) {
    const existing = await AttendanceMachineRepository.findBySn(data.sn)
    if (existing) {
      throw new Error(`Mesin dengan SN ${data.sn} sudah terdaftar.`)
    }
    return await AttendanceMachineRepository.create(data)
  }

  static async update(id: string, data: AttendanceMachineInput) {
    const existing = await AttendanceMachineRepository.findBySn(data.sn)
    if (existing && existing.id !== id) {
      throw new Error(`Mesin dengan SN ${data.sn} sudah digunakan oleh data lain.`)
    }
    return await AttendanceMachineRepository.update(id, data)
  }

  static async delete(id: string) {
    return await AttendanceMachineRepository.delete(id)
  }

  static async getAll() {
    return await AttendanceMachineRepository.findAll()
  }

  static async findBySn(sn: string) {
    return await AttendanceMachineRepository.findBySn(sn)
  }
}
