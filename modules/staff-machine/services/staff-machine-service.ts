import { StaffMachineRepository } from "../repositories/staff-machine-repository"
import { StaffMachineInput } from "../schemas/staff-machine"

export class StaffMachineService {
  static async create(data: StaffMachineInput) {
    const existingStaffMachine = await StaffMachineRepository.findByStaffAndMachine(data.staffId, data.machineId)
    if (existingStaffMachine) {
      throw new Error(`Staff ini sudah memiliki ID di mesin tersebut.`)
    }

    const existingId = await StaffMachineRepository.findByMachineAndUserId(data.machineId, data.machineUserId)
    if (existingId) {
      throw new Error(`ID ${data.machineUserId} sudah digunakan oleh staff lain di mesin ini.`)
    }

    return await StaffMachineRepository.create(data)
  }

  static async update(id: string, data: StaffMachineInput) {
    const existingStaffMachine = await StaffMachineRepository.findByStaffAndMachine(data.staffId, data.machineId)
    if (existingStaffMachine && existingStaffMachine.id !== id) {
      throw new Error(`Staff ini sudah memiliki ID di mesin tersebut.`)
    }

    const existingId = await StaffMachineRepository.findByMachineAndUserId(data.machineId, data.machineUserId)
    if (existingId && existingId.id !== id) {
      throw new Error(`ID ${data.machineUserId} sudah digunakan oleh staff lain di mesin ini.`)
    }

    return await StaffMachineRepository.update(id, data)
  }

  static async delete(id: string) {
    return await StaffMachineRepository.delete(id)
  }

  static async getByStaffId(staffId: string) {
    return await StaffMachineRepository.findByStaff(staffId)
  }
}
