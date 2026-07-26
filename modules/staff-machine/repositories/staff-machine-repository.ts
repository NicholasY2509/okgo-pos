import { prisma } from "@/lib/prisma"
import { StaffMachineInput } from "../schemas/staff-machine"

export const StaffMachineRepository = {
  async create(data: StaffMachineInput) {
    return await prisma.staffMachine.create({ data })
  },
  async update(id: string, data: StaffMachineInput) {
    return await prisma.staffMachine.update({ where: { id }, data })
  },
  async delete(id: string) {
    return await prisma.staffMachine.delete({ where: { id } })
  },
  async findByStaffAndMachine(staffId: string, machineId: string) {
    return await prisma.staffMachine.findUnique({
      where: {
        staffId_machineId: {
          staffId,
          machineId
        }
      }
    })
  },
  async findByMachineAndUserId(machineId: string, machineUserId: string) {
    return await prisma.staffMachine.findUnique({
      where: {
        machineId_machineUserId: {
          machineId,
          machineUserId
        }
      }
    })
  },
  async findByStaff(staffId: string) {
    return await prisma.staffMachine.findMany({
      where: { staffId },
      include: {
        machine: {
          include: {
            branch: true
          }
        }
      }
    })
  }
}
