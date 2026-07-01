import { prisma } from "@/lib/prisma";
import { CreateRoleInput, UpdateRoleInput } from "../schemas/role-schema";

export let RoleRepository = {
    getAllRoles: async () => {
        return await prisma.role.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { branchStaffs: true }
            }
          }
        })
        },
    getRoleById: async (id: string) => {
        return await prisma.role.findUnique({
          where: { id },
        })
        },
    createRole: async (data: CreateRoleInput) => {
        return await prisma.role.create({
          data: {
            name: data.name,
            description: data.description,
          },
        })
        },
    updateRole: async (id: string, data: Omit<UpdateRoleInput, "id">) => {
        return await prisma.role.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
          },
        })
        },
    deleteRole: async (id: string) => {
        return await prisma.role.delete({
          where: { id },
        })
        }
};
