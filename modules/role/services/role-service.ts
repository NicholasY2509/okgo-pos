import { prisma } from "@/lib/prisma"
import { CreateRoleInput, UpdateRoleInput } from "../schemas/role-schema"

export class RoleService {
  static async getAllRoles() {
    return await prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { branchStaffs: true }
        }
      }
    })
  }

  static async getRoleById(id: string) {
    return await prisma.role.findUnique({
      where: { id },
    })
  }

  static async createRole(data: CreateRoleInput) {
    return await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
      },
    })
  }

  static async updateRole(id: string, data: Omit<UpdateRoleInput, "id">) {
    return await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    })
  }

  static async deleteRole(id: string) {
    return await prisma.role.delete({
      where: { id },
    })
  }
}
