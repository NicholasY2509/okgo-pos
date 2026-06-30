import { prisma } from "@/lib/prisma"
import { AssignStaffBranchInput, CreateBranchInput, UpdateBranchInput } from "../schemas/branch-schema"

export class BranchService {
  static async getAllBranches() {
    return await prisma.branch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { branchStaffs: true }
        }
      }
    })
  }

  static async createBranch(data: CreateBranchInput) {
    return await prisma.branch.create({
      data,
    })
  }

  static async updateBranch(id: string, data: Omit<UpdateBranchInput, 'id'>) {
    return await prisma.branch.update({
      where: { id },
      data,
    })
  }

  static async getBranchBySubdomain(subdomain: string) {
    return await prisma.branch.findUnique({
      where: { subdomain },
    })
  }

  static async getBranchStaffs(branchId: string) {
    return await prisma.branchStaff.findMany({
      where: { branchId },
      include: {
        staff: { include: { workPosition: true } },
        role: { select: { id: true, name: true } },
      }
    })
  }

  static async assignStaffToBranch(data: AssignStaffBranchInput) {
    return await prisma.branchStaff.upsert({
      where: {
        staffId_branchId: {
          staffId: data.staffId,
          branchId: data.branchId,
        }
      },
      update: {
        roleId: data.roleId,
      },
      create: {
        staffId: data.staffId,
        branchId: data.branchId,
        roleId: data.roleId,
      }
    })
  }

  static async removeBranchStaff(branchStaffId: string) {
    return await prisma.branchStaff.delete({
      where: { id: branchStaffId }
    })
  }

  static async getAllRoles() {
    return await prisma.role.findMany({
      orderBy: { name: 'asc' }
    })
  }

  static async getAllStaffs() {
    return await prisma.staff.findMany({
      orderBy: { firstName: 'asc' },
      include: { workPosition: true }
    })
  }
}
