import { prisma } from "@/lib/prisma";
import {
  AssignStaffBranchInput,
  BulkAssignStaffInput,
  BulkTransferStaffInput,
  CreateBranchInput,
  TransferBranchStaffInput,
  UpdateBranchInput,
} from "../schemas/branch-schema";

export const BranchRepository = {
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
    getBranchById: async (id: string) => {
        return await prisma.branch.findUnique({
          where: { id },
          select: { id: true, name: true, subdomain: true },
        })
        },
    getBranchesByIds: async (ids: string[]) => {
        if (!ids.length) return []
        return await prisma.branch.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, subdomain: true },
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
    bulkAssignStaff: async (data: BulkAssignStaffInput) => {
        return await prisma.$transaction(
          data.staffIds.map((staffId) =>
            prisma.branchStaff.upsert({
              where: {
                staffId_branchId: {
                  staffId,
                  branchId: data.branchId,
                },
              },
              update: {
                roleId: data.roleId,
              },
              create: {
                staffId,
                branchId: data.branchId,
                roleId: data.roleId,
              },
            })
          )
        )
    },
    transferBranchStaff: async (data: TransferBranchStaffInput) => {
        return await prisma.$transaction(async (tx) => {
          if (data.currentBranchId && data.currentBranchId !== data.targetBranchId) {
            await tx.branchStaff.deleteMany({
              where: {
                staffId: data.staffId,
                branchId: data.currentBranchId,
              },
            })
          }
          return await tx.branchStaff.upsert({
            where: {
              staffId_branchId: {
                staffId: data.staffId,
                branchId: data.targetBranchId,
              },
            },
            update: {
              roleId: data.roleId,
            },
            create: {
              staffId: data.staffId,
              branchId: data.targetBranchId,
              roleId: data.roleId,
            },
          })
        })
    },
    bulkTransferStaff: async (data: BulkTransferStaffInput) => {
        return await prisma.$transaction(async (tx) => {
          await tx.branchStaff.deleteMany({
            where: {
              staffId: { in: data.staffIds },
            },
          })
          return await Promise.all(
            data.staffIds.map((staffId) =>
              tx.branchStaff.create({
                data: {
                  staffId,
                  branchId: data.targetBranchId,
                  roleId: data.roleId,
                },
              })
            )
          )
        })
    },
    getStaffBranchAssignments: async (staffId: string) => {
        return await prisma.branchStaff.findMany({
          where: { staffId },
          include: {
            branch: true,
            role: true,
          },
          orderBy: { createdAt: "desc" },
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
          include: {
            workPosition: true,
            branchStaffs: {
              include: { branch: true },
            },
          },
        })
        }
};
