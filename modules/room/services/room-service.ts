import { prisma } from "@/lib/prisma";
import { RoomInput } from "../schemas/room-schema";

export class RoomService {
  static async getAll() {
    return await prisma.room.findMany({
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: string) {
    return await prisma.room.findUnique({
      where: { id },
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });
  }

  static async getByBranchId(branchId: string) {
    return await prisma.room.findMany({
      where: { branchId },
      orderBy: { name: "asc" },
    });
  }

  static async create(data: RoomInput) {
    return await prisma.room.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        isActive: data.isActive,
        branchId: data.branchId,
      },
    });
  }

  static async update(id: string, data: RoomInput) {
    return await prisma.room.update({
      where: { id },
      data: {
        name: data.name,
        capacity: data.capacity,
        isActive: data.isActive,
        branchId: data.branchId,
      },
    });
  }

  static async delete(id: string) {
    return await prisma.room.delete({
      where: { id },
    });
  }
}
