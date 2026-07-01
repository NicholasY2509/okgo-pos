import { prisma } from "@/lib/prisma";
import { RoomInput } from "../schemas/room-schema";

export let RoomRepository = {
    getAll: async () => {
        return await prisma.room.findMany({
          include: {
            branch: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        },
    getById: async (id: string) => {
        return await prisma.room.findUnique({
          where: { id },
          include: {
            branch: {
              select: { id: true, name: true },
            },
          },
        });
        },
    getByBranchId: async (branchId: string) => {
        return await prisma.room.findMany({
          where: { branchId },
          orderBy: { name: "asc" },
        });
        },
    getActiveByBranchId: async (branchId: string) => {
        return await prisma.room.findMany({
          where: { branchId, isActive: true },
          orderBy: { name: "asc" },
        });
        },
    create: async (data: RoomInput) => {
        return await prisma.room.create({
          data: {
            name: data.name,
            capacity: data.capacity,
            isActive: data.isActive,
            isVip: data.isVip,
            branchId: data.branchId,
          },
        });
        },
    update: async (id: string, data: RoomInput) => {
        return await prisma.room.update({
          where: { id },
          data: {
            name: data.name,
            capacity: data.capacity,
            isActive: data.isActive,
            isVip: data.isVip,
            branchId: data.branchId,
          },
        });
        },
    delete: async (id: string) => {
        return await prisma.room.delete({
          where: { id },
        });
        }
};
