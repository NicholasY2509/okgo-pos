import { prisma } from "@/lib/prisma"
import { AssignUserBranchInput, CreateBranchInput, UpdateBranchInput } from "../schemas/branch-schema"

export class BranchService {
  static async getAllBranches() {
    return await prisma.branch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true }
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

  static async getBranchUsers(branchId: string) {
    return await prisma.branchUser.findMany({
      where: { branchId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        role: { select: { id: true, name: true } },
      }
    })
  }

  static async assignUserToBranch(data: AssignUserBranchInput) {
    return await prisma.branchUser.upsert({
      where: {
        userId_branchId: {
          userId: data.userId,
          branchId: data.branchId,
        }
      },
      update: {
        roleId: data.roleId,
      },
      create: {
        userId: data.userId,
        branchId: data.branchId,
        roleId: data.roleId,
      }
    })
  }

  static async getAllRoles() {
    return await prisma.role.findMany({
      orderBy: { name: 'asc' }
    })
  }

  static async getAllUsers() {
    return await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true }
    })
  }
}
