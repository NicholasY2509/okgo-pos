import { prisma } from "@/lib/prisma";
import { AssignStaffBranchInput, CreateBranchInput, UpdateBranchInput } from "../schemas/branch-schema";

export let BranchRepository = {
    getAllBranches: async () => {
        return await prisma.branch.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { branchStaffs: true }
            }
          }
        })
        },
    createBranch: async (data: CreateBranchInput) => {
        return await prisma.branch.create({
          data,
        })
        },
    updateBranch: async (id: string, data: Omit<UpdateBranchInput, 'id'>) => {
        return await prisma.branch.update({
          where: { id },
          data,
        })
        },
    getBranchBySubdomain: async (subdomain: string) => {
        return await prisma.branch.findUnique({
          where: { subdomain },
        })
        },
    getBranchStaffs: async (branchId: string) => {
        return await prisma.branchStaff.findMany({
          where: { branchId },
          include: {
            staff: { include: { workPosition: true } },
            role: { select: { id: true, name: true } },
          }
        })
        },
    assignStaffToBranch: async (data: AssignStaffBranchInput) => {
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
        },
    removeBranchStaff: async (branchStaffId: string) => {
        return await prisma.branchStaff.delete({
          where: { id: branchStaffId }
        })
        },
    getAllRoles: async () => {
        return await prisma.role.findMany({
          orderBy: { name: 'asc' }
        })
        },
    getAllStaffs: async () => {
        return await prisma.staff.findMany({
          orderBy: { firstName: 'asc' },
          include: { workPosition: true }
        })
        }
};
